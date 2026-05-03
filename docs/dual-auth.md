# Dual Authentication System

The application supports two user authentication providers, configurable at runtime via the admin settings panel:

## Providers

### Credentials (default)

Standard email/password authentication with:

- PBKDF2-SHA512 password hashing (120k iterations)
- Cookie-based sessions (`user_session`, 14-day expiry, HMAC-SHA256 token hashing)
- Built-in registration and login forms

### Clerk

Third-party authentication via [Clerk](https://clerk.com):

- JWT-based stateless authentication (Bearer token in Authorization header)
- Clerk handles sign-in/sign-up UI components
- Users are synced to the local `User` model by email on first authentication
- Requires `@clerk/backend` (API) and `@clerk/react` (client) packages

## Configuration

1. Navigate to **Admin > Settings** in the admin panel
2. Select the authentication provider
3. If using Clerk, enter your Publishable Key and Secret Key
4. Save settings — changes take effect immediately

Settings are stored in the `SiteSetting` collection in MongoDB with these keys:

- `auth.provider` — `"credentials"` or `"clerk"`
- `auth.clerkPublishableKey` — Clerk frontend key (exposed to client)
- `auth.clerkSecretKey` — Clerk backend key (server-only, never sent to client)

## Architecture

### API (`app-api`)

- **`lib/user-auth.ts`** — `getUserSession()` dispatches to credential or Clerk path based on the configured provider
- **`lib/clerk-auth.ts`** — Verifies Clerk JWTs using `@clerk/backend`, fetches user data from Clerk API
- **`services/setting-service.ts`** — Typed access to auth config with validation
- **`controllers/setting-controller.ts`** — Admin-protected CRUD for settings + public auth config endpoint
- **`controllers/user-auth-controller.ts`** — Login/register disabled when provider is `"clerk"`

### Client (`app-client`)

- **`components/auth/auth-config-provider.tsx`** — React context that fetches auth config and lazily loads Clerk
- **`components/auth/clerk-auth.tsx`** — Clerk sign-in/sign-up components
- **`services/api-client.ts`** — Automatically attaches Bearer token when Clerk is active

### API Routes

| Route                       | Method | Auth   | Description                                 |
| --------------------------- | ------ | ------ | ------------------------------------------- |
| `/api/settings/auth`        | GET    | Public | Returns `{ provider, clerkPublishableKey }` |
| `/api/panel/settings`       | GET    | Admin  | Lists all settings                          |
| `/api/panel/settings/[key]` | PUT    | Admin  | Updates a setting                           |

## Important Notes

- **Admin authentication is always password-based** — switching to Clerk only affects user-facing auth
- When switching from credentials to Clerk, existing password-based user sessions remain valid until they expire
- Clerk users are auto-created in the local database on first sign-in with `passwordHash: ""` (cannot log in via credentials)
- The public auth config endpoint never exposes the Clerk secret key
