# Explore App

Explore is a mobile-first outdoor discovery app with a Spring Boot backend and
an Expo/React Native client. The current repo is in MVP shape: the core user
flows are implemented, the backend is production-oriented for a single-instance
deployment, and the mobile app supports both live API usage and an offline
content cache.

## Current MVP Scope

### Mobile app

- email/password auth
- public browsing of locations and journeys
- interactive map with locations and journeys shown together
- discovery/progress tracking
- trips saved under the current user
- offline content cache for locations, journeys, and journey stops
- admin screens for content management and legal document updates

### Backend

- Spring Boot REST API with JWT auth
- PostgreSQL + PostGIS
- Flyway migrations
- public, user, manager, and admin route separation
- backend-managed Firebase Storage image uploads
- optional scheduled PostgreSQL backups
- rate limiting with in-memory mode by default and database-backed mode
  available for multi-instance deployments

### Current state

- good fit for a single backend instance MVP
- mobile production builds expect an HTTPS API URL
- local Android device testing requires a LAN IP, not `localhost`
- local Android emulator testing uses `10.0.2.2`

## Repo Layout

- `apps/mobile`: Expo/React Native app
- `apps/api`: Spring Boot API
- `docs`: deployment, backup, and restore runbooks
- `docker-compose.yml`: local/full-stack container setup

## Prerequisites

### Mobile

- Node.js
- npm
- Android Studio and Android SDK for Android builds
- Expo tooling:
  - `npx expo ...`
  - `npx eas ...` for cloud/internal/release builds

### Backend

- Java 17
- Docker Desktop if you want local Postgres/PostGIS via Compose

## Environment Setup

### Mobile local env

Use [apps/mobile/.env.example](apps/mobile/.env.example) as the template for
`apps/mobile/.env`.

Required values:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_MAPTILER_API_KEY`

The mobile app automatically appends `/api` if you leave it off.

Examples:

- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080`
- iOS simulator: `EXPO_PUBLIC_API_URL=http://localhost:8080`
- physical device on same Wi-Fi: `EXPO_PUBLIC_API_URL=http://192.168.x.x:8080`

For a physical device, use the IPv4 address from your computer’s `Wireless LAN
adapter Wi-Fi` section in `ipconfig`.

Do not use these on a physical device:

- `localhost`
- `127.0.0.1`
- `10.0.2.2`

### Backend local env

The API reads env from the shell plus optional `.env` files. The main runtime
settings live in [apps/api/src/main/resources/application.properties](apps/api/src/main/resources/application.properties).

For production-style env values, use
[apps/api/.env.production.example](apps/api/.env.production.example).

## Running Locally

### Backend with Docker Compose

This is the easiest way to run Postgres and the API together:

```powershell
docker compose up --build
```

Default ports:

- API: `http://127.0.0.1:8080`
- Postgres: `localhost:5433`

Health check:

```powershell
Invoke-WebRequest http://127.0.0.1:8080/actuator/health
```

### Backend from the API app directly

From `apps/api`:

```powershell
.\gradlew.bat bootRun
```

Useful backend commands:

```powershell
.\gradlew.bat compileJava
.\gradlew.bat test
```

### Mobile in Expo

From `apps/mobile`:

```powershell
npm install
npm run start
```

This starts the Expo dev server.

### Android development build / dev client

From `apps/mobile`:

```powershell
npx expo run:android
```

What this is for:

- builds the Android native app locally
- installs a development build/dev client on the emulator or attached device
- good for day-to-day development when native modules are involved

What this is not:

- not the production Play Store build
- not the internal tester release APK produced by EAS

If you are targeting a physical Android device, make sure:

- USB debugging is enabled or wireless debugging is configured
- the phone can reach the backend LAN IP
- the app is fully restarted after changing `EXPO_PUBLIC_API_URL`

## Device Connection Rules

### Android emulator

Use:

- `http://10.0.2.2:8080`

### Physical Android device

Use:

- `http://<your-computer-lan-ip>:8080`

Requirements:

- phone and computer on the same network
- Windows firewall allows inbound traffic on port `8080`
- backend process is actually listening on `0.0.0.0:8080` or otherwise
  reachable from the LAN path you use

### iOS simulator

Use:

- `http://localhost:8080`

## Mobile Build Profiles

The mobile EAS profiles live in [apps/mobile/eas.json](apps/mobile/eas.json).

### `preview`

Command:

```powershell
npx eas build --platform android --profile preview
```

Use this for:

- internal debug-oriented Android testing
- developer preview builds

Current profile behavior:

- distribution: internal
- Android Gradle command: `:app:assembleDebug`

### `internal-production`

Command:

```powershell
npx eas build -p android --profile internal-production
```

Use this for:

- release-style APKs for testers
- the closest thing to an installable MVP test build

Current profile behavior:

- distribution: internal
- build type: APK
- requires `EXPO_PUBLIC_API_URL` with `https://`

### `production`

Command:

```powershell
npx eas build -p android --profile production
```

Use this for:

- Play Store / production release preparation

Current profile behavior:

- build type: Android App Bundle (`.aab`)
- requires `EXPO_PUBLIC_API_URL` with `https://`

## Tests And Quality Checks

### Mobile

From `apps/mobile`:

```powershell
npm run lint
npx tsc --noEmit --pretty false
npm test
npm run test:ci
```

### Backend

From `apps/api`:

```powershell
.\gradlew.bat compileJava
.\gradlew.bat test
```

## Deployment Overview

### Backend

For a production/single-instance VPS style deployment, the repo already has the
main pieces:

- Dockerfile in `apps/api`
- root `docker-compose.yml`
- production env template in [apps/api/.env.production.example](apps/api/.env.production.example)
- detailed release runbook in [docs/deployment-checklist.md](docs/deployment-checklist.md)

Typical Compose deployment:

```powershell
docker compose --env-file apps/api/.env.production up --build -d
```

### Mobile

Production mobile builds should point at a live HTTPS backend before the build
starts.

Use:

- `npx eas build -p android --profile internal-production` for installable tester APKs
- `npx eas build -p android --profile production` for production AABs

## Backups And Restore

See:

- [docs/database-backups.md](docs/database-backups.md)
- [docs/database-restore.md](docs/database-restore.md)
- [docs/deployment-checklist.md](docs/deployment-checklist.md)

## Operational Notes

- The backend is strongest today in a single-instance deployment.
- `RATE_LIMIT_STORAGE=memory` is acceptable for the current MVP deployment model.
- `RATE_LIMIT_STORAGE=database` is available when shared counters across
  multiple API instances are needed.
- Scheduled backups should be revisited if you later run multiple backend
  instances.

## Recommended MVP Smoke Test

Before tagging or pushing an MVP release:

- backend health endpoint returns `UP`
- mobile app loads locations and journeys
- login works
- register works
- map content loads
- one discovery/progress sync flow works
- one trip create/edit flow works
- one admin content edit flow works if admin tooling is part of the release

## Additional Docs

- [apps/mobile/README.md](apps/mobile/README.md)
- [docs/deployment-checklist.md](docs/deployment-checklist.md)
- [docs/database-backups.md](docs/database-backups.md)
- [docs/database-restore.md](docs/database-restore.md)
