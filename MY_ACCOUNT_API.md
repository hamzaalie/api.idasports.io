# My Account API - Complete Documentation

## Overview
The "My Account" API provides comprehensive account information for authenticated users, including subscription status, payment history, invoices, and account statistics.

## Endpoint

### GET /api/users/account

**Authentication Required**: Yes (JWT Bearer Token)

**Description**: Retrieves complete account details including subscription status, payment history, invoices, and usage statistics.

---

## Response Structure

```typescript
{
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    roles: string[];  // e.g., ["subscriber", "admin"]
    createdAt: Date;
  };
  subscription: {
    status: 'active' | 'expired' | 'cancelled' | 'none';
    isActive: boolean;
    startsAt: Date | null;
    expiresAt: Date | null;
    renewalDate: Date | null;  // When auto-renew will occur
    autoRenew: boolean;
    daysRemaining: number | null;  // Days until expiration
  };
  payments: [
    {
      id: string;
      transactionId: string;
      amount: number;  // In USD
      currency: string;  // "XOF" or "USD"
      status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
      paymentMethod: string | null;  // e.g., "card", "mobile_money"
      createdAt: Date;
      completedAt: Date | null;
    }
  ];
  invoices: [
    {
      id: string;
      invoiceNumber: string;  // e.g., "INV-2024-001"
      amount: number;
      issuedAt: Date;
      paidAt: Date | null;
      pdfUrl: string | null;  // Link to download PDF invoice
      paymentStatus: 'pending' | 'completed' | 'failed';
    }
  ];
  stats: {
    totalPayments: number;  // Count of completed payments
    totalSpent: number;  // Total amount spent (USD)
    activeSince: Date | null;  // When subscription first started
    lastPaymentDate: Date | null;  // Most recent payment date
  };
}
```

---

## Example Request

```bash
curl -X GET https://api.yourplatform.com/api/users/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Example Response

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "emailVerified": true,
    "roles": ["subscriber"],
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "subscription": {
    "status": "active",
    "isActive": true,
    "startsAt": "2024-12-01T00:00:00Z",
    "expiresAt": "2025-01-01T00:00:00Z",
    "renewalDate": "2025-01-01T00:00:00Z",
    "autoRenew": true,
    "daysRemaining": 15
  },
  "payments": [
    {
      "id": "pay-123",
      "transactionId": "TXN-1703241234-abc123",
      "amount": 29.99,
      "currency": "XOF",
      "status": "completed",
      "paymentMethod": "card",
      "createdAt": "2024-12-01T08:30:00Z",
      "completedAt": "2024-12-01T08:31:45Z"
    },
    {
      "id": "pay-122",
      "transactionId": "TXN-1700649234-def456",
      "amount": 29.99,
      "currency": "XOF",
      "status": "completed",
      "paymentMethod": "mobile_money",
      "createdAt": "2024-11-01T14:20:00Z",
      "completedAt": "2024-11-01T14:22:10Z"
    }
  ],
  "invoices": [
    {
      "id": "inv-123",
      "invoiceNumber": "INV-2024-123",
      "amount": 29.99,
      "issuedAt": "2024-12-01T08:31:45Z",
      "paidAt": "2024-12-01T08:31:45Z",
      "pdfUrl": "https://cdn.yourplatform.com/invoices/INV-2024-123.pdf",
      "paymentStatus": "completed"
    },
    {
      "id": "inv-122",
      "invoiceNumber": "INV-2024-122",
      "amount": 29.99,
      "issuedAt": "2024-11-01T14:22:10Z",
      "paidAt": "2024-11-01T14:22:10Z",
      "pdfUrl": "https://cdn.yourplatform.com/invoices/INV-2024-122.pdf",
      "paymentStatus": "completed"
    }
  ],
  "stats": {
    "totalPayments": 2,
    "totalSpent": 59.98,
    "activeSince": "2024-11-01T14:22:10Z",
    "lastPaymentDate": "2024-12-01T08:31:45Z"
  }
}
```

---

## Edge Cases Handled

### 1. **No Subscription**
If user has never subscribed:
```json
{
  "subscription": {
    "status": "none",
    "isActive": false,
    "startsAt": null,
    "expiresAt": null,
    "renewalDate": null,
    "autoRenew": false,
    "daysRemaining": null
  },
  "payments": [],
  "invoices": [],
  "stats": {
    "totalPayments": 0,
    "totalSpent": 0,
    "activeSince": null,
    "lastPaymentDate": null
  }
}
```

### 2. **Expired Subscription**
```json
{
  "subscription": {
    "status": "expired",
    "isActive": false,
    "startsAt": "2024-11-01T00:00:00Z",
    "expiresAt": "2024-12-01T00:00:00Z",
    "renewalDate": null,
    "autoRenew": false,
    "daysRemaining": null
  }
}
```

### 3. **Pending Payment**
```json
{
  "payments": [
    {
      "id": "pay-125",
      "transactionId": "TXN-1703502234-xyz789",
      "amount": 29.99,
      "currency": "XOF",
      "status": "pending",
      "paymentMethod": null,
      "createdAt": "2024-12-25T10:30:34Z",
      "completedAt": null
    }
  ]
}
```

### 4. **Failed Payment**
```json
{
  "payments": [
    {
      "id": "pay-124",
      "transactionId": "TXN-1703415834-failed",
      "amount": 29.99,
      "currency": "XOF",
      "status": "failed",
      "paymentMethod": "card",
      "createdAt": "2024-12-24T10:30:34Z",
      "completedAt": null
    }
  ]
}
```

---

## Status Codes

- **200 OK**: Account details retrieved successfully
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server error

---

## Frontend Integration Example

### React/TypeScript

```typescript
import axios from 'axios';

interface AccountData {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    roles: string[];
    createdAt: Date;
  };
  subscription: {
    status: string;
    isActive: boolean;
    expiresAt: Date | null;
    daysRemaining: number | null;
  };
  payments: Array<any>;
  invoices: Array<any>;
  stats: {
    totalPayments: number;
    totalSpent: number;
  };
}

const fetchAccountDetails = async (): Promise<AccountData> => {
  const token = localStorage.getItem('access_token');
  
  const response = await axios.get('/api/users/account', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return response.data;
};

// Usage in component
const AccountPage = () => {
  const [account, setAccount] = useState<AccountData | null>(null);
  
  useEffect(() => {
    fetchAccountDetails().then(setAccount);
  }, []);
  
  if (!account) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>My Account</h1>
      
      {/* Subscription Status */}
      <div className="subscription-card">
        <h2>Subscription</h2>
        <p>Status: {account.subscription.status}</p>
        <p>Active: {account.subscription.isActive ? 'Yes' : 'No'}</p>
        {account.subscription.daysRemaining && (
          <p>Days Remaining: {account.subscription.daysRemaining}</p>
        )}
      </div>
      
      {/* Payment History */}
      <div className="payments-section">
        <h2>Payment History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {account.payments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                <td>${payment.amount}</td>
                <td>{payment.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Invoices */}
      <div className="invoices-section">
        <h2>Invoices</h2>
        {account.invoices.map((invoice) => (
          <div key={invoice.id} className="invoice-item">
            <span>{invoice.invoiceNumber}</span>
            <span>${invoice.amount}</span>
            {invoice.pdfUrl && (
              <a href={invoice.pdfUrl} download>Download PDF</a>
            )}
          </div>
        ))}
      </div>
      
      {/* Stats */}
      <div className="stats-section">
        <h2>Account Statistics</h2>
        <p>Total Payments: {account.stats.totalPayments}</p>
        <p>Total Spent: ${account.stats.totalSpent.toFixed(2)}</p>
      </div>
    </div>
  );
};
```

---

## Testing

### Using cURL

```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.access_token')

# 2. Get account details
curl -X GET http://localhost:3000/api/users/account \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

### Using Postman

1. Create a GET request to `http://localhost:3000/api/users/account`
2. Add Authorization header: `Bearer YOUR_TOKEN`
3. Send request
4. Verify response structure matches documentation

---

## Notes

- All dates are returned in ISO 8601 format
- Amounts are in USD (converted from XOF internally)
- Payments and invoices are ordered by date (most recent first)
- The endpoint uses database-level joins for optimal performance
- Response is cached for 1 minute per user to reduce database load

---

## Related Endpoints

- `GET /api/users/me` - Get basic user profile
- `POST /api/payments/initiate` - Initiate new payment
- `GET /api/subscriptions/status` - Get current subscription status only
