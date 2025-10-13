# Stripe Integration Setup Guide

## Overview
This guide shows how to integrate the Python Stripe implementation into your React/Node/Express/MongoDB application.

## Backend Setup

### 1. Install Dependencies
```bash
cd server
npm install stripe
```

### 2. Environment Variables
Create a `.env` file in the `server` directory:
```env
ATLAS_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
PORT=3000
```

### 3. Get Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your **Secret Key** (starts with `sk_test_` for testing)
3. Add it to your `.env` file

## Frontend Setup

### 1. Test the Integration
1. Start your backend: `cd server && npm start`
2. Start your frontend: `cd frontend && npm run dev`
3. Navigate to `/buytickets` to test the Stripe integration

## API Endpoints

### Backend Endpoints (Node.js/Express)
- `POST /api/stripe/create-customer` - Create Stripe customer
- `POST /api/stripe/attach-payment-method` - Attach payment method
- `POST /api/stripe/purchase-currency` - Purchase currency
- `GET /api/stripe/customer/:userId` - Get customer info
- `GET /api/stripe/packages` - Get available packages
- `GET /api/stripe/transactions/:userId` - Get transaction history

### Frontend Components
- `StripePayment` - Main payment component
- `/buytickets` - Payment page route

## Testing

### Test Payment Methods (Stripe Test Tokens)
- `pm_card_visa` - Successful Visa payments
- `pm_card_mastercard` - Successful Mastercard payments
- `pm_card_chargeDeclined` - Always declined
- `pm_card_insufficient_funds` - Insufficient funds error

### Test Flow
1. **Create Customer**: User creates Stripe customer account
2. **Attach Payment Method**: Use test tokens (pm_card_visa, etc.)
3. **Purchase Currency**: Buy tickets with attached payment method
4. **View Balance**: Check updated ticket balance

## Currency Packages
- **Starter Pack**: $10.00 → 100 tickets
- **Popular Pack**: $25.00 → 300 tickets  
- **Premium Pack**: $50.00 → 700 tickets

## Database Models

### StripeCustomer
- `userId` - Reference to Users collection
- `stripeCustomerId` - Stripe customer ID
- `email` - Customer email
- `name` - Customer name
- `currencyBalance` - Current ticket balance
- `defaultPaymentMethod` - Attached payment method

### StripeTransaction
- `userId` - Reference to Users collection
- `amountPaid` - Amount paid in cents
- `currencyPurchased` - Tickets purchased
- `packageName` - Package name
- `stripePaymentId` - Stripe payment intent ID
- `status` - Transaction status

## Security Features
- ✅ PCI Compliant - No raw card data on server
- ✅ Test Token Support - Safe testing with Stripe test tokens
- ✅ Production Ready - Supports real payment methods via Stripe.js
- ✅ Secure Error Handling - Proper exception handling

## Production Deployment

### Frontend (Stripe.js Integration)
For production, replace test tokens with Stripe.js:
```javascript
// Install Stripe.js
npm install @stripe/stripe-js

// Use Stripe Elements for card collection
import { loadStripe } from '@stripe/stripe-js';
```

### Backend
- Use production Stripe keys (`sk_live_...`)
- Implement proper error logging
- Add webhook handling for payment confirmations

## File Structure
```
server/
├── models/
│   ├── StripeCustomer.js
│   └── StripeTransaction.js
├── controllers/
│   └── Stripe.js
├── routes/
│   └── Stripe.js
└── index.js

frontend/src/
├── components/
│   └── StripePayment.tsx
├── pages/
│   └── buytickets.tsx
└── api.tsx
```

## Next Steps
1. Set up environment variables
2. Test with Stripe test tokens
3. Implement Stripe.js for production
4. Add webhook handling
5. Deploy to production

The integration is now complete and ready for testing!
