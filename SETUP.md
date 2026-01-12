# Central Backend - Setup Guide

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Create a PostgreSQL database:

```sql
CREATE DATABASE central_backend_dev;
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Update these critical values in `.env`:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_actual_password
DATABASE_NAME=central_backend_dev

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CinetPay
CINETPAY_API_KEY=your_cinetpay_api_key
CINETPAY_SITE_ID=your_site_id
CINETPAY_SECRET_KEY=your_secret_key
```

### 4. Run Database Migrations

TypeORM will auto-sync in development mode. For production, create migrations:

```bash
npm run migration:generate -- -n InitialSchema
npm run migration:run
```

### 5. Start the Application

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/api/docs

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/me` - Get current user profile

### Subscriptions
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/cancel` - Cancel subscription

### Validation (for M3)
- `POST /api/validate/access` - Validate user access
- `POST /api/validate/endpoint` - Check endpoint access
- `GET /api/validate/subscription` - Quick subscription check

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users/:id/roles` - Assign role
- `PATCH /api/admin/users/:id/subscription` - Override subscription
- `GET /api/admin/audit-logs` - View audit logs

### Webhooks
- `POST /api/webhooks/cinetpay` - CinetPay payment webhook

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🔒 Security Notes

1. **Never commit `.env` file** - it contains secrets
2. **Change JWT_SECRET** in production to a secure random string
3. **Use HTTPS** in production
4. **Verify webhook signatures** from CinetPay
5. **Rate limit** all endpoints in production

## 📦 Project Structure

```
src/
├── auth/               # JWT authentication, guards, strategies
│   ├── decorators/     # Custom decorators (Roles)
│   ├── dto/            # Data transfer objects
│   ├── entities/       # RefreshToken entity
│   ├── guards/         # JWT & Role guards
│   └── strategies/     # Passport JWT strategy
├── users/              # User management
│   └── entities/       # User, UserRole entities
├── subscriptions/      # Subscription management
│   └── entities/       # Subscription entity
├── payments/           # Payment processing
│   └── entities/       # Payment, Invoice entities
├── webhooks/           # CinetPay webhook handlers
├── admin/              # Admin panel API
├── audit/              # Audit logging
│   └── entities/       # AuditLog entity
├── validation/         # M3 access validation
└── common/             # Shared utilities (to be added)
```

## 🔄 Development Workflow

1. Make changes to source code
2. TypeScript compiles automatically in watch mode
3. Server restarts automatically
4. Test endpoints via Swagger UI

## 🌐 Integration with V1 & M3

### From V1 (Registration/Login)
```javascript
// Register
POST https://backend.domain.com/api/auth/register
{ email, password }

// Login
POST https://backend.domain.com/api/auth/login
{ email, password }
→ Returns { accessToken, refreshToken }
```

### From M3 (Validate Access)
```javascript
// Validate on entry
POST https://backend.domain.com/api/validate/access
Headers: { Authorization: "Bearer <accessToken>" }
→ Returns { hasAccess: true/false, roles, subscriptionStatus }

// Check specific endpoint
POST https://backend.domain.com/api/validate/endpoint
Headers: { Authorization: "Bearer <accessToken>" }
Body: { endpoint: "/api/data-entry/player-stats" }
→ Returns { canAccess: true/false }
```

## 📊 Database Schema

The database automatically creates these tables:

- `users` - User accounts
- `user_roles` - User role assignments
- `subscriptions` - Subscription records
- `payments` - Payment transactions
- `invoices` - Generated invoices
- `refresh_tokens` - JWT refresh tokens
- `audit_logs` - Audit trail

## 🐛 Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

### JWT Errors
- Check `JWT_SECRET` is set
- Verify token hasn't expired
- Ensure Bearer token format: `Authorization: Bearer <token>`

### Webhook Not Working
- Verify CinetPay credentials
- Check webhook URL is accessible
- Review audit logs for errors

## 📝 TODO

- [ ] Email service integration (SendGrid/AWS SES)
- [ ] CinetPay payment initiation endpoint
- [ ] Webhook signature verification
- [ ] Rate limiting middleware
- [ ] Input sanitization
- [ ] Unit tests
- [ ] E2E tests
- [ ] Docker configuration
- [ ] CI/CD pipeline

## 🆘 Support

For issues or questions during 30-day support period, contact development team.
