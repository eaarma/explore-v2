# Deployment Checklist

This checklist is the production release runbook for the current Explore app
stack.

It assumes:

- backend deploys with the hardened production profile
- location images are stored in Firebase Storage through the backend only
- nightly PostgreSQL backups are enabled
- mobile production builds are created through EAS with an HTTPS API URL

## 1. Pre-deploy checks

Before starting a deployment:

- confirm the branch is merged or otherwise frozen for release
- confirm GitHub Actions CI is green:
  - backend tests
  - mobile lint
  - mobile typecheck
  - mobile tests
- confirm the backend geospatial tests pass on the current branch
- confirm the latest database backup completed successfully
- if the release includes risky schema or content changes, create an extra
  manual backup before deployment

## 2. Required backend configuration

Make sure the deployment environment is populated from
[apps/api/.env.production.example](../apps/api/.env.production.example).

Required values:

- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`

Recommended values:

- `JWT_EXPIRATION_MS`
- `RATE_LIMIT_ENABLED`
- rate-limit overrides if production traffic needs different values

Required for backend-managed image uploads:

- `FIREBASE_STORAGE_BUCKET`
- either `FIREBASE_SERVICE_ACCOUNT_PATH`
- or `FIREBASE_SERVICE_ACCOUNT_BASE64`

## 3. Required mobile production configuration

Make sure the production mobile build environment is populated from
[apps/mobile/.env.production.example](../apps/mobile/.env.production.example).

Required values:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_MAPTILER_API_KEY`

Production mobile requirements:

- `EXPO_PUBLIC_API_URL` must use `https://`
- the backend host in that URL must already be live before building the app

## 4. Firebase checks

Before deploy:

- confirm the correct Firebase Storage bucket is configured in backend env
- confirm the service account used by the backend can access the bucket
- confirm the current rules file is deployed from [storage.rules](../storage.rules)

Deploy rules if needed:

```bash
firebase deploy --only storage
```

Current expected rule posture:

- direct client SDK reads and writes are denied by default
- backend uploads/deletes run through the Admin SDK

## 5. Database safety checks

Before deploy:

- confirm the nightly backup workflow is enabled and healthy
- confirm the most recent backup object exists in Firebase Storage
- for risky releases, create a manual backup using
  [backup-postgres-to-firebase.sh](../scripts/backups/backup-postgres-to-firebase.sh)

If you need restore steps, use:

- [database-backups.md](./database-backups.md)
- [database-restore.md](./database-restore.md)

## 6. Backend deployment steps

### If deploying with Docker Compose

1. prepare the production env file from
   [apps/api/.env.production.example](../apps/api/.env.production.example)
2. verify `JWT_SECRET` and datasource values are present
3. pull the latest code on the target host
4. deploy:

```bash
docker compose --env-file apps/api/.env.production up --build -d
```

### If deploying another way

Use the same production env values and make sure:

- Flyway migrations run successfully
- the app starts with `SPRING_PROFILES_ACTIVE=prod`
- `ddl-auto` stays on validation behavior, not schema mutation

## 7. Post-deploy backend verification

Check the backend first:

- health endpoint returns `UP`
- logs show successful startup
- no Flyway migration failures
- no Firebase credential or bucket errors

Minimum smoke checks:

- `GET /actuator/health`
- login works
- `/api/public/locations`
- `/api/public/journeys`
- admin image upload works
- discovery check works for an authenticated user

## 8. Mobile release steps

Before starting a production mobile build:

- confirm the backend production URL is already live
- confirm `EXPO_PUBLIC_API_URL` uses `https://`
- confirm the mobile app is pointed at the correct production backend

Then build the production app with EAS using the production environment values.

After the build:

- install the build on a real device
- verify login
- verify public content loads
- verify discovery sync still works
- verify admin image management works if the app exposes it in production

## 9. Post-release verification

After deployment is live:

- confirm CI remains green on the deployed revision
- confirm the next scheduled nightly database backup still succeeds
- confirm no unexpected rate-limit spikes or auth errors appear in logs
- confirm public routes do not expose inactive content
- confirm managers cannot update users

## 10. Rollback / recovery

If the release must be rolled back:

- roll the backend app back to the previous known-good revision
- if data recovery is required, restore from a selected backup using
  [restore-postgres-from-firebase.sh](../scripts/backups/restore-postgres-from-firebase.sh)
- verify:
  - `/actuator/health`
  - row counts for `users`, `locations`, and `journeys`
  - login and public route behavior

Use [database-restore.md](./database-restore.md) for the exact restore flow.

## 11. Known current caveat

The repo currently ignores `apps/mobile/android/` as an untracked generated
folder. If a release depends on native Android files inside that directory,
those changes will not be pushed unless the ignore/tracking strategy is changed.
