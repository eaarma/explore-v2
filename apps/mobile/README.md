# Explore Mobile

## Local development

Copy `.env.example` to `.env` and replace the placeholders you need:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_MAPTILER_API_KEY`

Location image uploads are backend-managed, so the mobile app does not need any
public Firebase Storage env vars for the current architecture.

If `EXPO_PUBLIC_API_URL` is missing during local development, the app can still
fall back to the local Expo host or emulator defaults.

## Tests

Run the mobile unit tests with:

- `npm test`

For CI-style local runs without workers or watch mode:

- `npm run test:ci`

## Preview builds

The `preview` EAS profile builds a debug Android artifact and currently points
at the deployed HTTPS backend configured in [eas.json](./eas.json). It is still
a debug-oriented build profile, so use it for developer testing rather than
wide APK distribution.

## Internal production APKs

Use the `internal-production` EAS profile when you want a release-style Android
APK that can be installed directly by testers.

## Production builds

The `internal-production` and `production` EAS profiles must provide both
`EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_MAPTILER_API_KEY` before build time.
`EXPO_PUBLIC_API_URL` must use `https://`, and release builds will now fail
fast if either value is missing or if the API URL still points to plain HTTP.

Use `.env.production.example` as the template for the public variables you want
to define in EAS or CI.
