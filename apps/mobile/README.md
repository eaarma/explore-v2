# Explore Mobile

The main repo guide now lives in the root [README](../../README.md).

Use that file for:

- local backend + mobile setup
- emulator vs physical-device API URL rules
- `npx expo run:android` usage
- EAS `preview`, `internal-production`, and `production` commands
- test and deployment workflow

## Mobile env files

- local template: [`.env.example`](./.env.example)
- production template: [`.env.production.example`](./.env.production.example)

Key values:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_MAPTILER_API_KEY`

The app appends `/api` automatically if it is omitted.

## Quick commands

From `apps/mobile`:

```powershell
npm install
npm run start
npx expo run:android
npm run lint
npx tsc --noEmit --pretty false
npm test
```
