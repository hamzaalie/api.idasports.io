# Central Backend - Scouting Platform

Central authentication, subscription, and payment backend for V1 and M3 applications.

## Architecture

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT + Refresh Tokens
- **Payment Gateway**: CinetPay

## Features

- ✅ User authentication (register, login, email verification, password reset)
- ✅ JWT-based session management with refresh tokens
- ✅ Subscription management (active/expired/cancelled)
- ✅ CinetPay payment integration with webhooks
- ✅ Role-based access control (subscriber, limited_user, admin roles)
- ✅ Invoice generation
- ✅ Audit logging
- ✅ Admin panel API

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Update database credentials
3. Set JWT secret
4. Configure CinetPay credentials
5. Set email provider settings

## Database Setup

```bash
# Run migrations
npm run migration:run

# Create migration
npm run migration:create -- -n MigrationName
```

## Running the app

```bash
# development
npm run start:dev

# production
npm run start:prod
```

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## API Documentation

Swagger documentation available at: `http://localhost:3000/api/docs`

## Project Structure

```
src/
├── auth/               # Authentication module (JWT, guards, strategies)
├── users/              # User management
├── subscriptions/      # Subscription logic
├── payments/           # Payment processing
├── webhooks/           # CinetPay webhooks
├── admin/              # Admin panel endpoints
├── audit/              # Audit logging
├── validation/         # M3 validation endpoints
├── common/             # Shared utilities, decorators, filters
├── config/             # Configuration module
└── database/           # Database entities, migrations
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

Proprietary
