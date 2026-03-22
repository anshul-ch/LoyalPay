# LLD - AuthService

## Responsibilities

- Manage user identity and account creation
- Generate access + refresh tokens
- Handle profile read and KYC submit
- Publish `UserRegisteredEvent`

## Main Components

- `Controllers/AuthController.cs`
- `Controllers/ProfileController.cs`
- `Services/AuthService.cs`
- `Services/JwtHelper.cs`
- `Data/AuthDbContext.cs`

## Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/profile`
- `POST /api/profile/kyc`

## Data Model

- `User`
- `RefreshToken`

## Key Logic

- Signup creates user, then publishes `UserRegisteredEvent`
- Login revokes active refresh tokens and issues new pair
- Refresh checks revocation + expiry before issuing next pair
- KYC stores document metadata and file path
