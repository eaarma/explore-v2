package com.explore.app.locations.service;

import com.explore.app.shared.BadRequestException;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Bucket;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.StorageClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

@Service
public class LocationImageStorageService {

    private static final long MAX_UPLOAD_SIZE_BYTES = 10L * 1024L * 1024L;
    private final String bucketName;
    private final String locationImageStorageRoot;
    private final String serviceAccountPath;
    private final String serviceAccountBase64;

    private final Object firebaseAppMonitor = new Object();
    private FirebaseApp firebaseApp;

    public LocationImageStorageService(
            @Value("${firebase.storage.bucket:}") String bucketName,
            @Value("${firebase.storage.location-image-root:locations}") String locationImageStorageRoot,
            @Value("${firebase.storage.service-account-path:${FIREBASE_SERVICE_ACCOUNT_PATH:${GOOGLE_APPLICATION_CREDENTIALS:}}}") String serviceAccountPath,
            @Value("${firebase.storage.service-account-base64:${FIREBASE_SERVICE_ACCOUNT_BASE64:}}") String serviceAccountBase64) {
        this.bucketName = normalizeOptional(bucketName);
        this.locationImageStorageRoot = normalizeOptional(locationImageStorageRoot) != null
                ? normalizeOptional(locationImageStorageRoot)
                : "locations";
        this.serviceAccountPath = normalizeOptional(serviceAccountPath);
        this.serviceAccountBase64 = normalizeOptional(serviceAccountBase64);
    }

    public UploadedLocationImage uploadLocationImage(Long locationId, MultipartFile file) {
        ValidatedLocationImageUpload validatedUpload = validateUploadFile(file);

        String fileName = buildStorageFileName(file, validatedUpload.fileExtension());
        String storagePath = buildLocationImageStoragePath(locationId, fileName);
        String downloadToken = UUID.randomUUID().toString();

        Map<String, String> metadata = new HashMap<>();
        metadata.put("firebaseStorageDownloadTokens", downloadToken);
        metadata.put("locationId", String.valueOf(locationId));
        metadata.put("originalFileName", normalizeOptional(file.getOriginalFilename()) != null
                ? normalizeOptional(file.getOriginalFilename())
                : fileName);

        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(requireBucketName(), storagePath))
                .setContentType(validatedUpload.contentType())
                .setMetadata(metadata)
                .build();

        getBucket().getStorage().create(blobInfo, validatedUpload.bytes());

        return new UploadedLocationImage(
                buildDownloadUrl(storagePath, downloadToken),
                storagePath,
                fileName);
    }

    public void deleteLocationImage(Long locationId, String storagePath) {
        String normalizedStoragePath = validateLocationStoragePath(locationId, storagePath);
        getBucket().getStorage().delete(requireBucketName(), normalizedStoragePath);
    }

    public void deleteLocationImages(Long locationId, List<String> storagePaths) {
        if (storagePaths == null || storagePaths.isEmpty()) {
            return;
        }

        List<String> normalizedStoragePaths = validateLocationStoragePaths(locationId, storagePaths);
        for (String normalizedStoragePath : normalizedStoragePaths) {
            getBucket().getStorage().delete(requireBucketName(), normalizedStoragePath);
        }
    }

    public String validateLocationStoragePath(Long locationId, String storagePath) {
        validateLocationId(locationId);

        String normalizedStoragePath = normalizeRequiredStoragePath(storagePath);
        validateStoragePathStructure(normalizedStoragePath);

        String allowedPrefix = buildLocationStoragePrefix(locationId);
        if (!normalizedStoragePath.startsWith(allowedPrefix)) {
            throw new BadRequestException("Storage path does not belong to this location");
        }

        return normalizedStoragePath;
    }

    public List<String> validateLocationStoragePaths(Long locationId, List<String> storagePaths) {
        validateLocationId(locationId);

        if (storagePaths == null || storagePaths.isEmpty()) {
            return List.of();
        }

        List<String> normalizedStoragePaths = new ArrayList<>();

        for (String storagePath : storagePaths) {
            String normalizedStoragePath = normalizeOptional(storagePath);

            if (normalizedStoragePath == null) {
                continue;
            }

            normalizedStoragePaths.add(validateLocationStoragePath(locationId, normalizedStoragePath));
        }

        return normalizedStoragePaths;
    }

    ValidatedLocationImageUpload validateUploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Location image file is required");
        }

        if (file.getSize() > MAX_UPLOAD_SIZE_BYTES) {
            throw new IllegalArgumentException("Location images must be 10 MB or smaller");
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException exception) {
            throw new IllegalArgumentException("Could not read the uploaded image", exception);
        }

        if (fileBytes.length == 0) {
            throw new IllegalArgumentException("Location image file is required");
        }

        DetectedImageFormat detectedFormat = detectImageFormat(fileBytes);
        if (detectedFormat == null) {
            throw new IllegalArgumentException("Uploaded file is not a supported image");
        }

        validateContentType(file.getContentType(), detectedFormat);
        validateImageContent(fileBytes, detectedFormat);

        return new ValidatedLocationImageUpload(
                fileBytes,
                detectedFormat.contentType(),
                detectedFormat.fileExtension());
    }

    private void validateContentType(String contentType, DetectedImageFormat detectedFormat) {
        String normalizedContentType = normalizeOptional(contentType);
        if (normalizedContentType == null || "application/octet-stream".equalsIgnoreCase(normalizedContentType)) {
            return;
        }

        String lowerCaseContentType = normalizedContentType.toLowerCase(Locale.ROOT);
        if (!lowerCaseContentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image uploads are supported");
        }

        if (!detectedFormat.matchesContentType(lowerCaseContentType)) {
            throw new IllegalArgumentException("Image content type does not match the uploaded file");
        }
    }

    private void validateImageContent(byte[] fileBytes, DetectedImageFormat detectedFormat) {
        if (!detectedFormat.requiresImageReaderValidation()) {
            return;
        }

        try (ImageInputStream imageInputStream = ImageIO.createImageInputStream(new ByteArrayInputStream(fileBytes))) {
            if (imageInputStream == null) {
                throw new IllegalArgumentException("Uploaded image could not be decoded");
            }

            Iterator<ImageReader> imageReaders = ImageIO.getImageReaders(imageInputStream);
            if (!imageReaders.hasNext()) {
                throw new IllegalArgumentException("Uploaded image could not be decoded");
            }

            ImageReader imageReader = imageReaders.next();
            try {
                imageReader.setInput(imageInputStream, true, true);

                int width = imageReader.getWidth(0);
                int height = imageReader.getHeight(0);
                if (width <= 0 || height <= 0) {
                    throw new IllegalArgumentException("Uploaded image could not be decoded");
                }
            } finally {
                imageReader.dispose();
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Uploaded image could not be decoded", exception);
        }
    }

    private Bucket getBucket() {
        return StorageClient.getInstance(getFirebaseApp()).bucket(requireBucketName());
    }

    private FirebaseApp getFirebaseApp() {
        synchronized (firebaseAppMonitor) {
            if (firebaseApp != null) {
                return firebaseApp;
            }

            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                    .setCredentials(resolveCredentials())
                    .setStorageBucket(requireBucketName());

            firebaseApp = FirebaseApp.initializeApp(optionsBuilder.build(), "location-image-storage");
            return firebaseApp;
        }
    }

    private GoogleCredentials resolveCredentials() {
        try {
            if (serviceAccountBase64 != null) {
                byte[] decoded = java.util.Base64.getDecoder().decode(serviceAccountBase64);
                return GoogleCredentials.fromStream(new ByteArrayInputStream(decoded));
            }

            if (serviceAccountPath != null) {
                try (java.io.InputStream inputStream = java.nio.file.Files.newInputStream(
                        java.nio.file.Path.of(serviceAccountPath))) {
                    return GoogleCredentials.fromStream(inputStream);
                }
            }

            throw new IllegalStateException(
                    "Firebase Storage credentials must be configured with firebase.storage.service-account-path, "
                            + "firebase.storage.service-account-base64, FIREBASE_SERVICE_ACCOUNT_PATH, "
                            + "FIREBASE_SERVICE_ACCOUNT_BASE64, or GOOGLE_APPLICATION_CREDENTIALS");
        } catch (IOException exception) {
            throw new IllegalStateException("Could not initialize Firebase Storage credentials", exception);
        }
    }

    private String requireBucketName() {
        if (bucketName == null) {
            throw new IllegalStateException("firebase.storage.bucket must be configured for backend image uploads");
        }

        return bucketName;
    }

    private String buildLocationStoragePrefix(Long locationId) {
        return locationImageStorageRoot + "/" + locationId + "/";
    }

    private String buildLocationImageStoragePath(Long locationId, String fileName) {
        return buildLocationStoragePrefix(locationId) + System.currentTimeMillis() + "-" + createShortId() + "-" + fileName;
    }

    private String buildStorageFileName(MultipartFile file, String fileExtension) {
        String sanitizedBaseName = sanitizeFileName(stripFileExtension(file.getOriginalFilename()));
        String fileBaseName = sanitizedBaseName != null ? sanitizedBaseName : "location-image";
        return fileBaseName + "." + fileExtension;
    }

    private String buildDownloadUrl(String storagePath, String downloadToken) {
        String encodedStoragePath = URLEncoder.encode(storagePath, StandardCharsets.UTF_8);
        return "https://firebasestorage.googleapis.com/v0/b/"
                + requireBucketName()
                + "/o/"
                + encodedStoragePath
                + "?alt=media&token="
                + downloadToken;
    }

    private String normalizeRequiredStoragePath(String value) {
        String normalizedValue = normalizeOptional(value);

        if (normalizedValue == null) {
            throw new IllegalArgumentException("storagePath is required");
        }

        return normalizedValue;
    }

    private void validateLocationId(Long locationId) {
        if (locationId == null || locationId <= 0L) {
            throw new BadRequestException("Valid locationId is required for image storage operations");
        }
    }

    private void validateStoragePathStructure(String storagePath) {
        if (storagePath.contains("..")
                || storagePath.contains("\\")
                || storagePath.startsWith("/")
                || storagePath.endsWith("/")) {
            throw new BadRequestException("Storage path is invalid");
        }
    }

    private String sanitizeFileName(String value) {
        String trimmedValue = normalizeOptional(value);

        if (trimmedValue == null) {
            return null;
        }

        String sanitizedFileName = trimmedValue
                .toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9._-]", "");

        return sanitizedFileName.isEmpty() ? null : sanitizedFileName;
    }

    private String stripFileExtension(String value) {
        String normalizedValue = normalizeOptional(value);
        if (normalizedValue == null) {
            return null;
        }

        int lastDotIndex = normalizedValue.lastIndexOf('.');
        if (lastDotIndex <= 0) {
            return normalizedValue;
        }

        return normalizedValue.substring(0, lastDotIndex);
    }

    private DetectedImageFormat detectImageFormat(byte[] fileBytes) {
        if (isJpeg(fileBytes)) {
            return DetectedImageFormat.JPEG;
        }

        if (isPng(fileBytes)) {
            return DetectedImageFormat.PNG;
        }

        if (isGif(fileBytes)) {
            return DetectedImageFormat.GIF;
        }

        if (isBmp(fileBytes)) {
            return DetectedImageFormat.BMP;
        }

        if (isWebp(fileBytes)) {
            return DetectedImageFormat.WEBP;
        }

        String isoBrand = readIsoBmffBrand(fileBytes);
        if (isoBrand == null) {
            return null;
        }

        if (Set.of("heic", "heix", "hevc", "hevx", "heim", "heis").contains(isoBrand)) {
            return DetectedImageFormat.HEIC;
        }

        if (Set.of("heif", "mif1", "msf1").contains(isoBrand)) {
            return DetectedImageFormat.HEIF;
        }

        return null;
    }

    private boolean isJpeg(byte[] fileBytes) {
        return fileBytes.length >= 3
                && unsignedByte(fileBytes[0]) == 0xFF
                && unsignedByte(fileBytes[1]) == 0xD8
                && unsignedByte(fileBytes[2]) == 0xFF;
    }

    private boolean isPng(byte[] fileBytes) {
        return fileBytes.length >= 8
                && unsignedByte(fileBytes[0]) == 0x89
                && fileBytes[1] == 'P'
                && fileBytes[2] == 'N'
                && fileBytes[3] == 'G'
                && unsignedByte(fileBytes[4]) == 0x0D
                && unsignedByte(fileBytes[5]) == 0x0A
                && unsignedByte(fileBytes[6]) == 0x1A
                && unsignedByte(fileBytes[7]) == 0x0A;
    }

    private boolean isGif(byte[] fileBytes) {
        if (fileBytes.length < 6) {
            return false;
        }

        String header = new String(fileBytes, 0, 6, StandardCharsets.US_ASCII);
        return "GIF87a".equals(header) || "GIF89a".equals(header);
    }

    private boolean isBmp(byte[] fileBytes) {
        return fileBytes.length >= 2
                && fileBytes[0] == 'B'
                && fileBytes[1] == 'M';
    }

    private boolean isWebp(byte[] fileBytes) {
        return fileBytes.length >= 12
                && fileBytes[0] == 'R'
                && fileBytes[1] == 'I'
                && fileBytes[2] == 'F'
                && fileBytes[3] == 'F'
                && fileBytes[8] == 'W'
                && fileBytes[9] == 'E'
                && fileBytes[10] == 'B'
                && fileBytes[11] == 'P';
    }

    private String readIsoBmffBrand(byte[] fileBytes) {
        if (fileBytes.length < 12) {
            return null;
        }

        if (fileBytes[4] != 'f'
                || fileBytes[5] != 't'
                || fileBytes[6] != 'y'
                || fileBytes[7] != 'p') {
            return null;
        }

        return new String(fileBytes, 8, 4, StandardCharsets.US_ASCII).toLowerCase(Locale.ROOT);
    }

    private int unsignedByte(byte value) {
        return value & 0xFF;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    private String createShortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    public record UploadedLocationImage(
            String url,
            String storagePath,
            String fileName) {
    }

    record ValidatedLocationImageUpload(
            byte[] bytes,
            String contentType,
            String fileExtension) {
    }

    private enum DetectedImageFormat {
        JPEG("image/jpeg", "jpg", true, Set.of("image/jpeg", "image/jpg")),
        PNG("image/png", "png", true, Set.of("image/png")),
        GIF("image/gif", "gif", true, Set.of("image/gif")),
        BMP("image/bmp", "bmp", true, Set.of("image/bmp", "image/x-ms-bmp")),
        WEBP("image/webp", "webp", false, Set.of("image/webp")),
        HEIC("image/heic", "heic", false, Set.of("image/heic")),
        HEIF("image/heif", "heif", false, Set.of("image/heif"));

        private final String contentType;
        private final String fileExtension;
        private final boolean requiresImageReaderValidation;
        private final Set<String> allowedContentTypes;

        DetectedImageFormat(
                String contentType,
                String fileExtension,
                boolean requiresImageReaderValidation,
                Set<String> allowedContentTypes) {
            this.contentType = contentType;
            this.fileExtension = fileExtension;
            this.requiresImageReaderValidation = requiresImageReaderValidation;
            this.allowedContentTypes = allowedContentTypes;
        }

        String contentType() {
            return contentType;
        }

        String fileExtension() {
            return fileExtension;
        }

        boolean requiresImageReaderValidation() {
            return requiresImageReaderValidation;
        }

        boolean matchesContentType(String value) {
            return allowedContentTypes.contains(value);
        }
    }
}
