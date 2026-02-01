from typing import Union, Dict, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid
from datetime import datetime

import os

import dotenv
import stripe

# print(stripe)

# STRIPE TESTING DOCUMENTATION
# 
# For Testing (Postman/Backend):
# Use Stripe test payment method tokens:
#   pm_card_visa - Successful Visa payments
#   pm_card_mastercard - Successful Mastercard payments  
#   pm_card_amex - Successful Amex payments
#   pm_card_visa_debit - Successful Visa debit
#   pm_card_chargeDeclined - Always declined
#   pm_card_insufficient_funds - Insufficient funds error
#
# NOTE: Test tokens (pm_card_*) are used directly in PaymentIntents and don't need
# to be attached to customers. The attach-payment-method endpoint handles this automatically.
#
# For Production (Frontend):
# Use Stripe.js to securely collect card data and generate payment method IDs
# Never send raw card numbers to your backend - this violates PCI compliance

dotenv.load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

app = FastAPI()

# Currency packages - easily configurable
CURRENCY_PACKAGES = {
    "package_1": {"price": 1000, "currency_amount": 100, "name": "Starter Pack"},  # $10 = 100 coins
    "package_2": {"price": 2500, "currency_amount": 300, "name": "Popular Pack"},  # $25 = 300 coins  
    "package_3": {"price": 5000, "currency_amount": 700, "name": "Premium Pack"},  # $50 = 700 coins
}

# In-memory storage (MongoDB-ready structure)
customers: Dict[str, Dict] = {}
transactions: Dict[str, Dict] = {}

# Pydantic models for request/response
class CreateCustomerRequest(BaseModel):
    email: str
    name: str

class AttachPaymentMethodRequest(BaseModel):
    user_id: str
    payment_method_id: str

class PurchaseCurrencyRequest(BaseModel):
    user_id: str
    package_id: str



@app.post("/stripe/create-customer")
def create_customer(request: CreateCustomerRequest):
    """
    Create a Stripe customer and store mapping in memory
    """
    try:
        # Create customer in Stripe
        stripe_customer = stripe.Customer.create(
            email=request.email,
            name=request.name,
            description=f"Customer for currency purchases"
        )
        
        # Generate user_id (in real app, this would come from auth system)
        user_id = str(uuid.uuid4())
        
        # Store customer mapping
        customers[user_id] = {
            "stripe_customer_id": stripe_customer.id,
            "email": request.email,
            "name": request.name,
            "currency_balance": 0,
            "created_at": datetime.now().isoformat()
        }
        
        return {
            "status": "success",
            "user_id": user_id,
            "stripe_customer_id": stripe_customer.id,
            "message": "Customer created successfully"
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/stripe/attach-payment-method")
def attach_payment_method(request: AttachPaymentMethodRequest):
    """
    Attach a payment method to a customer and set as default.
    For testing: Use Stripe test tokens (pm_card_visa, pm_card_mastercard, etc.)
    For production: Frontend uses Stripe.js to generate payment method IDs
    """
    try:
        # Validate user exists
        if request.user_id not in customers:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        customer_data = customers[request.user_id]
        stripe_customer_id = customer_data["stripe_customer_id"]
        
        # For test tokens, we don't need to attach them - they're already valid
        # Just store the payment method ID for use in purchases
        if request.payment_method_id.startswith("pm_card_"):
            # This is a Stripe test token - store it directly
            customers[request.user_id]["default_payment_method"] = request.payment_method_id
            return {
                "status": "success",
                "message": "Test payment method configured for customer",
                "payment_method_id": request.payment_method_id
            }
        else:
            # This is a real payment method from Stripe.js - attach it
            stripe.PaymentMethod.attach(
                request.payment_method_id,
                customer=stripe_customer_id
            )
            
            # Set as default payment method
            stripe.Customer.modify(
                stripe_customer_id,
                invoice_settings={
                    "default_payment_method": request.payment_method_id
                }
            )
            
            # Store the default payment method in our customer data
            customers[request.user_id]["default_payment_method"] = request.payment_method_id
            
            return {
                "status": "success",
                "message": "Payment method attached and set as default",
                "payment_method_id": request.payment_method_id
            }
        
    except stripe.error.StripeError as e:
        if "already attached" in str(e).lower():
            raise HTTPException(status_code=400, detail="Payment method already attached to this customer")
        elif "invalid" in str(e).lower():
            raise HTTPException(status_code=400, detail=f"Invalid payment method: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/stripe/purchase-currency")
def purchase_currency(request: PurchaseCurrencyRequest):
    """
    Purchase currency using saved payment method
    """
    try:
        # Validate user exists
        if request.user_id not in customers:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Validate package exists
        if request.package_id not in CURRENCY_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package ID")
        
        customer_data = customers[request.user_id]
        package = CURRENCY_PACKAGES[request.package_id]
        
        # Check if customer has a default payment method
        default_payment_method = customer_data.get("default_payment_method")
        if not default_payment_method:
            raise HTTPException(status_code=400, detail="No payment method attached. Please attach a payment method first.")
        
        # Create and confirm PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=package["price"],
            currency="usd",
            customer=customer_data["stripe_customer_id"],
            payment_method=default_payment_method,
            confirm=True,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never"
            },
            metadata={
                "user_id": request.user_id,
                "package_id": request.package_id,
                "currency_amount": str(package["currency_amount"])
            }
        )
        
        if payment_intent.status == "succeeded":
            # Credit currency balance
            customers[request.user_id]["currency_balance"] += package["currency_amount"]
            
            # Record transaction
            transaction_id = str(uuid.uuid4())
            transactions[transaction_id] = {
                "user_id": request.user_id,
                "amount_paid": package["price"],
                "currency_purchased": package["currency_amount"],
                "package_name": package["name"],
                "timestamp": datetime.now().isoformat(),
                "stripe_payment_id": payment_intent.id,
                "status": "completed"
            }
            
            return {
                "status": "success",
                "transaction_id": transaction_id,
                "currency_purchased": package["currency_amount"],
                "new_balance": customers[request.user_id]["currency_balance"],
                "message": "Currency purchase successful"
            }
        else:
            raise HTTPException(status_code=400, detail=f"Payment failed: {payment_intent.status}")
            
    except stripe.error.StripeError as e:
        if "card_declined" in str(e).lower():
            raise HTTPException(status_code=400, detail="Card was declined. Please try a different payment method.")
        elif "insufficient_funds" in str(e).lower():
            raise HTTPException(status_code=400, detail="Insufficient funds. Please try a different payment method.")
        elif "invalid_payment_method" in str(e).lower():
            raise HTTPException(status_code=400, detail="Invalid payment method. Please attach a new payment method.")
        else:
            raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/stripe/customer/{user_id}")
def get_customer(user_id: str):
    """
    Get customer info and currency balance
    """
    if user_id not in customers:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer_data = customers[user_id]
    return {
        "user_id": user_id,
        "email": customer_data["email"],
        "name": customer_data["name"],
        "currency_balance": customer_data["currency_balance"],
        "stripe_customer_id": customer_data["stripe_customer_id"],
        "created_at": customer_data["created_at"]
    }

@app.get("/stripe/packages")
def get_packages():
    """
    Get available currency packages
    """
    return {
        "packages": [
            {
                "package_id": package_id,
                "name": package["name"],
                "price_cents": package["price"],
                "price_dollars": package["price"] / 100,
                "currency_amount": package["currency_amount"]
            }
            for package_id, package in CURRENCY_PACKAGES.items()
        ]
    }

@app.get("/stripe/transactions/{user_id}")
def get_transactions(user_id: str):
    """
    Get purchase history for user
    """
    if user_id not in customers:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    user_transactions = [
        {
            "transaction_id": tx_id,
            "amount_paid": tx["amount_paid"],
            "currency_purchased": tx["currency_purchased"],
            "package_name": tx["package_name"],
            "timestamp": tx["timestamp"],
            "status": tx["status"]
        }
        for tx_id, tx in transactions.items()
        if tx["user_id"] == user_id
    ]
    
    return {
        "user_id": user_id,
        "transactions": sorted(user_transactions, key=lambda x: x["timestamp"], reverse=True)
    }