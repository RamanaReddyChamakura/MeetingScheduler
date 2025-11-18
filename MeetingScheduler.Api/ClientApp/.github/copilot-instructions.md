# Copilot Instructions for Meeting Scheduler Client (Angular)

## Overview
- Framework: Angular 20, standalone components (no NgModules).
- Auth: Azure AD via `@azure/msal-angular` + `@azure/msal-browser` configured in `src/msal.ts`.
- API: Calls proxied to backend at `https://localhost:44344` using `proxy.conf.json` for `"/api"`.
- UI: Routing in `src/routes.ts`; main calendar in `src/app/calendar/calendar.component.ts`; admin screens under `src/app/admin`.

## Dev Workflows
- Install and serve (uses proxy):
  - `npm install`
  - `npm start` (equivalent to `ng serve -o`)
- Build production:
  - `npm run build` → `dist/meeting-scheduler-client`
- Backend dependency: Start the API at `https://localhost:44344` and trust its dev certificate, or update `proxy.conf.json`.

## Auth & HTTP
- MSAL instance/scopes live in `src/msal.ts` (placeholders `YOUR_SPA_CLIENT_ID`, `YOUR_TENANT_ID`, and API scope). Update for your tenant.
- `MsalInterceptor` attaches tokens for URLs in `protectedResourceMap`:
  - `/api/` → API scope (e.g., `api://.../user_impersonation`)
  - `https://graph.microsoft.com/v1.0/` → Graph scopes
- Prefer calling the backend with relative `"/api/..."` paths so the dev proxy and interceptor work. Example:
  - Good: `this.http.get('/api/rooms')`
  - Avoid: Hard-coded `https://localhost:44344/...` (some admin code uses this; prefer `/api/...`).

## Routing & Structure
- Routes are defined centrally in `src/routes.ts` and provided via `provideRouter(routes)` in `src/main.ts`.
- `src/app/app.routes.ts` simply re-exports those routes; add new routes to `src/routes.ts`.
- Guard pattern: `src/app/admin/admin.guard.ts` exports a standalone `CanActivateFn` (`canActivateAdmin`) that calls the API. Prefer relative `/api/admin/am-i-admin`.

## Components & Patterns
- Standalone components with explicit `imports`: see `AppComponent`, `AdminRoomsComponent`, `AdminUsersComponent`, `CalendarComponent`.
- Forms: Template-driven via `FormsModule` (added globally in `main.ts` and per component where needed).
- HTTP: Use `provideHttpClient(withInterceptors([authInterceptor]))` in `main.ts`; `authInterceptor` is a pass-through because MSAL handles tokens.
- Calendar: Uses `angular-calendar` with `date-fns` adapter (`DateAdapter` via `adapterFactory`). Events/availability are fetched from the API.

## API Endpoints Used (examples)
- Rooms: `GET /api/rooms`
- Availability: `GET /api/availability/rooms/{roomEmail}?start={iso}&end={iso}&interval=30`
- Create meeting: `POST /api/meetings` with `{ subject, start, end, attendees[], roomId, timeZoneId }`
- Admin:
  - `GET /api/admin/am-i-admin`
  - `GET /api/admin/admins`
  - `POST /api/admin/grant-admin` (body: JSON string UPN)
  - `POST /api/admin/rooms` (create)
  - `POST /api/admin/seed-rooms` (import from Graph)

## Conventions & Tips
- Use relative `/api` for backend calls to benefit from the dev proxy and MSAL token injection.
- Keep components standalone; import `CommonModule`, `FormsModule`, etc., explicitly in `imports`.
- Keep auth scopes in sync: if you add new API routes, update `protectedResourceMap` in `src/msal.ts` if the URL base changes.
- UI shell and login/logout live in `AppComponent`; use `MsalService` for interactive flows.
- Production build enables output hashing; budgets set in `angular.json`.

## Adding Features (quick examples)
- New route + component:
  1) Create a standalone component under `src/app/...`.
  2) Add `{ path: 'feature', component: FeatureComponent }` in `src/routes.ts`.
- New API call with auth:
  ```ts
  constructor(private http: HttpClient) {}
  this.http.post('/api/meetings', payload).subscribe(...);
  ```
- Admin guard reuse:
  ```ts
  { path: 'admin/feature', component: X, canActivate: [canActivateAdmin] }
  ```
