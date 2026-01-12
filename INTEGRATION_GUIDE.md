# Integration Guide: V1 & M3 → Central Backend

## 🔗 Overview

This guide explains how to integrate V1 (public website) and M3 (scouting platform) with the central backend.

---

## 📡 V1 Integration (Public Website)

### 1. User Registration

**Replace V1's registration with:**

```typescript
// V1 Frontend
async function register(email: string, password: string) {
  const response = await fetch('http://backend-url/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Show success message
    // Tell user to check email for verification
    return data;
  } else {
    // Handle error (user exists, validation failed, etc.)
    throw new Error(data.message);
  }
}
```

### 2. User Login

**Replace V1's login with:**

```typescript
// V1 Frontend
async function login(email: string, password: string) {
  const response = await fetch('http://backend-url/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Store tokens securely
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    // Store user info
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } else {
    throw new Error(data.message);
  }
}
```

### 3. Get User Profile

```typescript
// V1 Frontend
async function getProfile() {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch('http://backend-url/api/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (response.ok) {
    return await response.json();
  } else if (response.status === 401) {
    // Token expired, refresh it
    await refreshAccessToken();
    return getProfile(); // Retry
  } else {
    throw new Error('Failed to get profile');
  }
}
```

### 4. Refresh Token

```typescript
// V1 Frontend
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://backend-url/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } else {
    // Refresh token expired, user must login again
    logout();
    window.location.href = '/login';
  }
}
```

### 5. Check Subscription Status

```typescript
// V1 Frontend
async function checkSubscription() {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch('http://backend-url/api/subscriptions/status', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  
  return {
    isActive: data.isActive,
    status: data.status,
    expiresAt: data.expiresAt
  };
}
```

### 6. Logout

```typescript
// V1 Frontend
async function logout() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  await fetch('http://backend-url/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  window.location.href = '/';
}
```

---

## 🔐 M3 Integration (Scouting Platform)

### 1. Access Token from V1

When user navigates from V1 to M3, pass the access token:

**Option A: URL Parameter (less secure)**
```
https://m3.domain.com/?token=<accessToken>
```

**Option B: Shared LocalStorage (same domain)**
```javascript
// V1 stores token
localStorage.setItem('accessToken', token);

// M3 reads token
const token = localStorage.getItem('accessToken');
```

**Option C: Backend Session (recommended)**
- V1 creates session ID, stores in backend
- Passes session ID to M3
- M3 retrieves token from backend using session ID

### 2. Django Middleware for JWT Validation

Create `jwt_auth_middleware.py` in M3:

```python
import jwt
import requests
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.models import AnonymousUser

class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get token from header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            
            try:
                # Decode JWT (verify signature)
                payload = jwt.decode(
                    token,
                    settings.JWT_SECRET,
                    algorithms=['HS256']
                )
                
                # Add user info to request
                request.user_id = payload['userId']
                request.user_email = payload['email']
                request.user_roles = payload['roles']
                
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)
        else:
            request.user_id = None
            request.user_roles = []
        
        response = self.get_response(request)
        return response
```

### 3. Access Control Decorator for M3

```python
# decorators.py
from functools import wraps
from django.http import JsonResponse
import requests

def require_active_subscription(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user_id = getattr(request, 'user_id', None)
        
        if not user_id:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Check subscription with backend
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        response = requests.post(
            'http://backend-url/api/validate/access',
            headers={'Authorization': auth_header}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data['hasAccess']:
                # Cache roles in request
                request.user_roles = data['roles']
                request.subscription_status = data['subscriptionStatus']
                return view_func(request, *args, **kwargs)
            else:
                return JsonResponse({
                    'error': 'Access denied',
                    'reason': data.get('reason', 'No active subscription')
                }, status=403)
        else:
            return JsonResponse({'error': 'Validation failed'}, status=500)
    
    return wrapper
```

### 4. Limited User Decorator

```python
# decorators.py
def allow_limited_user(view_func):
    """
    Allows limited users to access specific data-entry endpoints
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user_id = getattr(request, 'user_id', None)
        
        if not user_id:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Get endpoint path
        endpoint = request.path
        
        # Check if user can access this endpoint
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        response = requests.post(
            'http://backend-url/api/validate/endpoint',
            headers={
                'Authorization': auth_header,
                'Content-Type': 'application/json'
            },
            json={'endpoint': endpoint}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data['canAccess']:
                return view_func(request, *args, **kwargs)
            else:
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'Limited users cannot access this endpoint'
                }, status=403)
        else:
            return JsonResponse({'error': 'Validation failed'}, status=500)
    
    return wrapper
```

### 5. M3 View Example

```python
# views.py
from django.http import JsonResponse
from .decorators import require_active_subscription, allow_limited_user

@require_active_subscription
def scouting_dashboard(request):
    """
    Full access - subscribers only
    """
    return JsonResponse({
        'message': 'Welcome to scouting dashboard',
        'user_id': request.user_id,
        'roles': request.user_roles
    })

@allow_limited_user
def data_entry_form(request):
    """
    Limited access - both subscribers and limited users can access
    """
    if request.method == 'POST':
        # Save data
        return JsonResponse({'message': 'Data saved'})
    else:
        return JsonResponse({'message': 'Data entry form'})

@require_active_subscription
def analytics_view(request):
    """
    Subscribers only - limited users blocked
    """
    if 'limited_user' in request.user_roles:
        return JsonResponse({
            'error': 'Limited users cannot access analytics'
        }, status=403)
    
    return JsonResponse({'message': 'Analytics data'})
```

### 6. M3 Settings Configuration

Add to M3 `settings.py`:

```python
# settings.py

# Central Backend
CENTRAL_BACKEND_URL = os.getenv('CENTRAL_BACKEND_URL', 'http://localhost:3000')
JWT_SECRET = os.getenv('JWT_SECRET', 'your-jwt-secret')

# Middleware
MIDDLEWARE = [
    # ... other middleware
    'path.to.jwt_auth_middleware.JWTAuthenticationMiddleware',
    # ... other middleware
]

# Limited User Endpoints (whitelist)
LIMITED_USER_ALLOWED_ENDPOINTS = [
    '/api/data-entry/player-stats',
    '/api/data-entry/match-report',
    '/api/data-entry/forms',
]
```

### 7. Periodic Validation (Every 15 Minutes)

```javascript
// M3 Frontend (JavaScript/TypeScript)
let validationTimer;

function startValidationTimer() {
  validationTimer = setInterval(async () => {
    const accessToken = localStorage.getItem('accessToken');
    
    const response = await fetch('http://backend-url/api/validate/access', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (!data.hasAccess) {
      // Access revoked
      alert('Your subscription has expired. Redirecting to V1...');
      window.location.href = 'http://v1-url/subscription';
    }
  }, 15 * 60 * 1000); // 15 minutes
}

// Start when user enters M3
startValidationTimer();

// Stop when user leaves
window.addEventListener('beforeunload', () => {
  clearInterval(validationTimer);
});
```

---

## 🔄 Flow Examples

### Flow 1: User Registration → M3 Access

```
1. User visits V1
2. User registers via POST /api/auth/register
3. Backend sends verification email
4. User clicks verification link → POST /api/auth/verify-email
5. User logs in → POST /api/auth/login → receives tokens
6. User subscribes (pays) → CinetPay webhook → subscription activated
7. User navigates to M3 with access token
8. M3 validates token → POST /api/validate/access → granted
9. User accesses M3 features
```

### Flow 2: Subscription Expires

```
1. User is active in M3
2. Subscription expires (cron job sets status=expired)
3. Next validation check → POST /api/validate/access → denied
4. M3 redirects user to V1 subscription page
5. User renews → Payment webhook → subscription reactivated
6. User can access M3 again
```

### Flow 3: Limited User Access

```
1. Admin assigns 'limited_user' role → POST /api/admin/users/:id/roles
2. Limited user logs in → receives token with 'limited_user' role
3. User tries to access M3 dashboard → POST /api/validate/endpoint
4. Backend checks endpoint against whitelist → denied
5. User tries data-entry form → POST /api/validate/endpoint
6. Backend checks endpoint against whitelist → granted
7. User can only submit data, not browse analytics
```

---

## ⚙️ Configuration Checklist

### V1 Configuration
- [ ] Update auth endpoints to use central backend
- [ ] Implement token storage (localStorage/cookies)
- [ ] Implement token refresh logic
- [ ] Update subscription UI to show status from backend
- [ ] Add redirect to M3 with token passing

### M3 Configuration
- [ ] Add JWT authentication middleware
- [ ] Add access control decorators
- [ ] Configure JWT secret (same as backend)
- [ ] Implement periodic validation
- [ ] Add redirect to V1 when access denied
- [ ] Whitelist data-entry endpoints for limited users

### Backend Configuration
- [ ] Set CORS origins (V1_URL, M3_URL)
- [ ] Configure JWT expiry times
- [ ] Set up CinetPay webhook URL
- [ ] Configure email service

---

## 🧪 Testing Integration

### Test 1: Registration & Login (V1)
```bash
# Register
curl -X POST http://backend-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Login
curl -X POST http://backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

### Test 2: Validate Access (M3)
```bash
# Validate
curl -X POST http://backend-url/api/validate/access \
  -H "Authorization: Bearer <accessToken>"
```

### Test 3: Check Subscription (V1)
```bash
# Check subscription
curl -X GET http://backend-url/api/subscriptions/status \
  -H "Authorization: Bearer <accessToken>"
```

---

## 🚨 Common Integration Issues

### Issue 1: CORS Errors
**Symptom**: Browser blocks requests from V1/M3 to backend

**Solution**: Add V1/M3 URLs to backend CORS config in `main.ts`

### Issue 2: Token Expired
**Symptom**: 401 Unauthorized errors

**Solution**: Implement automatic token refresh in V1/M3

### Issue 3: Subscription Check Slow
**Symptom**: M3 slow to load

**Solution**: Cache validation results for 5-15 minutes

### Issue 4: User Stuck After Payment
**Symptom**: User pays but can't access M3

**Solution**: 
- Check webhook is receiving events
- Check payment status in database
- Manually activate subscription via admin panel

---

## 📞 Support

For integration issues:
1. Check backend logs
2. Check audit logs: `GET /api/admin/audit-logs`
3. Verify JWT token is being sent correctly
4. Test endpoints via Swagger UI first

---

**Next**: Start with V1 login integration, then add M3 validation once V1 is working.
