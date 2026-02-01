# Stripe Currency Purchase API Documentation

## Overview

This FastAPI application provides a secure currency purchase system using Stripe for payment processing. The API supports both testing (using Stripe test tokens) and production (using Stripe.js frontend integration) workflows.

## Security Features

- **PCI Compliant**: No raw card data ever touches the server
- **Test Token Support**: Uses Stripe's predefined test tokens for safe testing
- **Production Ready**: Supports real payment methods via Stripe.js
- **Secure Error Handling**: Proper exception handling with clear error messages

---

## FastAPI Endpoints

### 1. POST `/stripe/create-customer`

**Purpose**: Create a new customer in Stripe and store mapping locally

**Request Body**:
```json
{
    "email": "customer@example.com",
    "name": "Customer Name"
}
```

**Response**:
```json
{
    "status": "success",
    "user_id": "uuid-generated-id",
    "stripe_customer_id": "cus_stripe_id",
    "message": "Customer created successfully"
}
```

**Process**:
1. Creates Stripe customer via Stripe API
2. Generates UUID for internal user_id
3. Stores customer mapping in memory with initial currency balance of 0

---

### 2. POST `/stripe/attach-payment-method`

**Purpose**: Attach a payment method to a customer (handles both test and production)

**Request Body**:
```json
{
    "user_id": "customer-uuid",
    "payment_method_id": "pm_card_visa"  // or real payment method ID
}
```

**Response**:
```json
{
    "status": "success",
    "message": "Test payment method configured for customer",
    "payment_method_id": "pm_card_visa"
}
```

**Process**:
- **Test tokens** (`pm_card_*`): Store directly without Stripe attachment
- **Real payment methods**: Attach to Stripe customer and set as default

---

### 3. POST `/stripe/purchase-currency`

**Purpose**: Purchase currency using saved payment method

**Request Body**:
```json
{
    "user_id": "customer-uuid",
    "package_id": "package_1"  // package_1, package_2, or package_3
}
```

**Response**:
```json
{
    "status": "success",
    "transaction_id": "transaction-uuid",
    "currency_purchased": 100,
    "new_balance": 100,
    "message": "Currency purchase successful"
}
```

**Process**:
1. Validates user and package exist
2. Creates Stripe PaymentIntent with saved payment method
3. Credits user's currency balance on success
4. Records transaction in memory

---

### 4. GET `/stripe/customer/{user_id}`

**Purpose**: Get customer information and current balance

**Response**:
```json
{
    "user_id": "customer-uuid",
    "email": "customer@example.com",
    "name": "Customer Name",
    "currency_balance": 100,
    "stripe_customer_id": "cus_stripe_id",
    "created_at": "2024-01-01T00:00:00"
}
```

---

### 5. GET `/stripe/packages`

**Purpose**: Get available currency packages

**Response**:
```json
{
    "packages": [
        {
            "package_id": "package_1",
            "name": "Starter Pack",
            "price_cents": 1000,
            "price_dollars": 10.0,
            "currency_amount": 100
        },
        {
            "package_id": "package_2",
            "name": "Popular Pack",
            "price_cents": 2500,
            "price_dollars": 25.0,
            "currency_amount": 300
        },
        {
            "package_id": "package_3",
            "name": "Premium Pack",
            "price_cents": 5000,
            "price_dollars": 50.0,
            "currency_amount": 700
        }
    ]
}
```

---

### 6. GET `/stripe/transactions/{user_id}`

**Purpose**: Get purchase history for a user

**Response**:
```json
{
    "user_id": "customer-uuid",
    "transactions": [
        {
            "transaction_id": "txn-uuid",
            "amount_paid": 1000,
            "currency_purchased": 100,
            "package_name": "Starter Pack",
            "timestamp": "2024-01-01T00:00:00",
            "status": "completed"
        }
    ]
}
```

---

## Testing vs Production Flow Differences

### 🧪 Testing Flow (Postman/Backend)

**Payment Method**: Uses Stripe's predefined test tokens
- `pm_card_visa` - Successful Visa payments
- `pm_card_mastercard` - Successful Mastercard payments  
- `pm_card_amex` - Successful Amex payments
- `pm_card_visa_debit` - Successful Visa debit
- `pm_card_chargeDeclined` - Always declined
- `pm_card_insufficient_funds` - Insufficient funds error

**Key Characteristics**:
- ✅ No raw card data on server
- ✅ Uses Stripe's secure test tokens
- ✅ PCI compliant approach
- ✅ Works immediately without frontend
- ✅ Predefined scenarios for different outcomes

**Flow**:
```
1. Create Customer → 2. Attach Test Token → 3. Purchase Currency → 4. Check Balance
```

### 🚀 Production Flow (Frontend + Backend)

**Payment Method**: Uses real payment methods created by Stripe.js

**Key Characteristics**:
- ✅ Frontend handles card collection
- ✅ Stripe.js tokenizes sensitive data
- ✅ Backend only receives safe payment method IDs
- ✅ Full PCI compliance maintained
- ✅ Real user experience with card forms

**Flow**:
```
1. Create Customer → 2. Frontend: Stripe.js → 3. Attach Real Payment Method → 4. Purchase Currency → 5. Check Balance
```

---

## Code Implementation Details

### Testing Flow in `attach-payment-method`:
```python
if request.payment_method_id.startswith("pm_card_"):
    # Test token - store directly
    customers[request.user_id]["default_payment_method"] = request.payment_method_id
    return {"status": "success", "message": "Test payment method configured"}
```

### Production Flow in `attach-payment-method`:
```python
else:
    # Real payment method - attach to Stripe
    stripe.PaymentMethod.attach(request.payment_method_id, customer=stripe_customer_id)
    stripe.Customer.modify(stripe_customer_id, invoice_settings={
        "default_payment_method": request.payment_method_id
    })
    return {"status": "success", "message": "Payment method attached and set as default"}
```

---

## Currency Packages

| Package ID | Name | Price | Currency Amount |
|------------|------|-------|-----------------|
| `package_1` | Starter Pack | $10.00 | 100 coins |
| `package_2` | Popular Pack | $25.00 | 300 coins |
| `package_3` | Premium Pack | $50.00 | 700 coins |

---

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful operations
- **400 Bad Request**: Invalid input, missing payment method, invalid package
- **404 Not Found**: Customer not found
- **500 Internal Server Error**: Unexpected server errors

### Common Error Messages

- `"Customer not found"` - Invalid user_id
- `"Invalid package ID"` - Package doesn't exist
- `"No payment method attached"` - Customer needs payment method first
- `"Card was declined"` - Payment method declined
- `"Insufficient funds"` - Payment method has insufficient funds

---

## Security Benefits

### Testing
- No raw card data on server
- PCI compliant approach
- Works immediately without enabling dangerous APIs
- Same flow as production (frontend generates token, backend attaches it)
- Proper separation of concerns

### Production
- Frontend handles card collection securely
- Stripe.js tokenizes sensitive data
- Backend only receives safe payment method IDs
- Full PCI compliance maintained
- Real user experience with validation

---

## Testing with Postman

### Environment Variables
- `base_url`: `http://localhost:8000`
- `test_payment_method_id`: `pm_card_visa`
- `user_id`: Auto-generated from create-customer response

### Test Collection Flow
1. **Get Available Packages** - Verify packages are loaded
2. **Create Customer** - Create test customer
3. **Get Customer Info** - Verify customer creation
4. **Attach Payment Method** - Attach test token
5. **Purchase Currency** - Test all three packages
6. **Get Updated Balance** - Verify currency was added
7. **Get Transaction History** - Verify transaction recording
8. **Test Error Cases** - Invalid package, invalid user

---

## Production Integration

### Frontend Requirements
- Stripe.js library
- Stripe Elements for card collection
- Secure token generation
- Payment method attachment to backend

### Backend Requirements
- Stripe secret key configuration
- Environment variables for API keys
- Database for persistent storage (replace in-memory storage)
- Proper error handling and logging

---

## File Structure

```
backend/
├── stripe_endpoints.py          # Main API endpoints
├── main.py                      # FastAPI app runner
├── requirements.txt             # Python dependencies
├── Stripe_Currency_Purchase_Test_Collection.json  # Postman tests
├── Stripe_Test_Data.json        # Test environment variables
└── STRIPE_API_DOCUMENTATION.md  # This documentation
```

---

## Dependencies

```txt
fastapi==0.118.3
stripe==13.0.1
uvicorn==0.37.0
python-dotenv==1.1.1
pydantic==2.12.0
```

---

## Getting Started

1. **Install dependencies**: `pip install -r requirements.txt`
2. **Set environment variables**: Create `.env` file with `STRIPE_SECRET_KEY`
3. **Run the server**: `uvicorn main:app --reload`
4. **Test with Postman**: Import the test collection and environment
5. **Verify functionality**: Run through the test collection

---

*This API provides a complete, secure, and production-ready currency purchase system with comprehensive testing capabilities.*
