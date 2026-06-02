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
at the LAN HTTP backend configured in [eas.json](./eas.json). That keeps the
physical-device development workflow working without weakening production.

## Production builds

Production builds must provide `EXPO_PUBLIC_API_URL` before build time, and it
must use `https://`. The production EAS profile will now fail fast if that
variable is missing or still points to plain HTTP.

Use `.env.production.example` as the template for the public variables you want
to define in EAS or CI.
