package com.explore.app.imports;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.explore.app.appconfig.model.AppConfiguration;
import com.explore.app.appconfig.repository.AppConfigurationRepository;
import com.explore.app.journeys.repository.JourneyLocationRepository;
import com.explore.app.journeys.repository.JourneyRepository;
import com.explore.app.locations.repository.LocationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class LegacyDataImporterTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private AppConfigurationRepository appConfigurationRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private JourneyRepository journeyRepository;

    @Mock
    private JourneyLocationRepository journeyLocationRepository;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private LegacyDataImporter legacyDataImporter;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(legacyDataImporter, "entityManager", entityManager);
    }

    @Test
    void runFailsFastWhenContentTablesArePartiallyPopulated() {
        when(locationRepository.count()).thenReturn(1L);
        when(journeyRepository.count()).thenReturn(0L);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> legacyDataImporter.run(null));

        verify(appConfigurationRepository, never()).findGlobal();
        org.junit.jupiter.api.Assertions.assertTrue(
                exception.getMessage().contains("both empty or both populated"));
    }

    @Test
    void runSkipsEmptyDatabaseWhenLegacySeedIsDisabled() throws Exception {
        AppConfiguration configuration = AppConfiguration.builder()
                .starterDataSeededAt(null)
                .build();

        ReflectionTestUtils.setField(legacyDataImporter, "legacySeedEnabled", false);
        when(locationRepository.count()).thenReturn(0L);
        when(journeyRepository.count()).thenReturn(0L);
        when(appConfigurationRepository.findGlobal()).thenReturn(Optional.of(configuration));

        legacyDataImporter.run(null);

        verify(objectMapper, never()).readValue(any(InputStream.class), eq(LegacyImportData.class));
        verify(appConfigurationRepository, never()).save(any(AppConfiguration.class));
    }

    @Test
    void runFailsWhenSeedMarkerExistsButTablesAreEmpty() {
        AppConfiguration configuration = AppConfiguration.builder()
                .starterDataSeededAt(Instant.parse("2026-06-14T12:00:00Z"))
                .build();

        ReflectionTestUtils.setField(legacyDataImporter, "legacySeedEnabled", false);
        when(locationRepository.count()).thenReturn(0L);
        when(journeyRepository.count()).thenReturn(0L);
        when(appConfigurationRepository.findGlobal()).thenReturn(Optional.of(configuration));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> legacyDataImporter.run(null));

        org.junit.jupiter.api.Assertions.assertTrue(
                exception.getMessage().contains("Refusing to reseed automatically"));
    }

    @Test
    void runMarksSeedAsAppliedAfterSuccessfulImport() throws Exception {
        AppConfiguration configuration = AppConfiguration.builder()
                .starterDataSeededAt(null)
                .build();
        Query nativeQuery = org.mockito.Mockito.mock(Query.class);

        ReflectionTestUtils.setField(legacyDataImporter, "legacySeedEnabled", true);
        ReflectionTestUtils.setField(
                legacyDataImporter,
                "legacyDataFile",
                new ByteArrayResource(new byte[0]) {
                    @Override
                    public String getDescription() {
                        return "test-exported-data.json";
                    }
                });

        when(locationRepository.count()).thenReturn(0L);
        when(journeyRepository.count()).thenReturn(0L);
        when(appConfigurationRepository.findGlobal()).thenReturn(Optional.of(configuration));
        when(objectMapper.readValue(any(InputStream.class), eq(LegacyImportData.class)))
                .thenReturn(new LegacyImportData(List.of(), List.of()));
        when(entityManager.createNativeQuery(anyString())).thenReturn(nativeQuery);
        when(nativeQuery.getSingleResult()).thenReturn(1L);
        when(appConfigurationRepository.save(any(AppConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        legacyDataImporter.run(null);

        ArgumentCaptor<AppConfiguration> configurationCaptor = ArgumentCaptor.forClass(AppConfiguration.class);
        verify(appConfigurationRepository).save(configurationCaptor.capture());
        assertNotNull(configurationCaptor.getValue().getStarterDataSeededAt());
    }
}
