# Cashfree Payment Integration Guide

## Overview

This guide explains how to set up and integrate Cashfree payment gateway into your e-commerce application.

## Prerequisites

- Active Cashfree account ([sign up here](https://cashfree.com))
- API credentials from Cashfree dashboard
- Node.js and npm/pnpm installed

## Step 1: Get Cashfree Credentials

1. Log in to [Cashfree Dashboard](https://dashboard.cashfree.com)
2. Navigate to **Settings → API Keys**
3. Copy your:
   - **App ID**
   - **Secret Key**
4. Note the environment: **Sandbox** (for testing) or **Production**

## Step 2: Environment Configuration

Add the following variables to your `.env.local` file:

```bash
# Cashfree Configuration
CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_CASHFREE_ENV=sandbox  # Change to "production" for live
NEXT_PUBLIC_CASHFREE_APP_ID=your_app_id_here  # App ID for frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your app's public URL
```

### Environment Values

| Variable                      | Description                      | Example                  |
| ----------------------------- | -------------------------------- | ------------------------ |
| `CASHFREE_APP_ID`             | Your Cashfree App ID             | `abc123xyz456`           |
| `CASHFREE_SECRET_KEY`         | Your Cashfree Secret Key         | `secret_xyz123abc456`    |
| `NEXT_PUBLIC_CASHFREE_ENV`    | Environment (sandbox/production) | `sandbox`                |
| `NEXT_PUBLIC_CASHFREE_APP_ID` | Public App ID for SDK            | `abc123xyz456`           |
| `NEXT_PUBLIC_APP_URL`         | Your application's public URL    | `https://yourdomain.com` |

## Step 3: Database Schema Updates

Make sure your `orders` table has the following columns:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_session_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata JSONB;
```

## Step 4: Webhook Configuration

1. Go to Cashfree Dashboard → **Settings → Webhooks**
2. Add a new webhook with:
   - **URL**: `https://yourdomain.com/api/cashfree/webhook`
   - **Events**: Select `PAYMENT_AUTHORIZED` and `PAYMENT_FAILED`
   - **Active**: Enable it

## Payment Flow

### 1. Customer selects Online Payment

- Checkout form redirects to Cashfree's payment gateway
- Customer selects payment method (Card, UPI, Wallet, etc.)

### 2. Payment Processing

- Cashfree handles the transaction securely
- Webhook sends payment status to your server

### 3. Order Confirmation

- Order status updates based on payment status
- Customer redirected to success/failure page

## File Structure

```
app/(site)/
├── api/
│   ├── cashfree/
│   │   ├── initiate/route.ts      # Initiate payment
│   │   └── webhook/route.ts       # Receive webhook & check status
│   └── orders/route.ts            # Create orders
├── checkout/
│   └── payment-callback/page.tsx  # Payment callback page
└── ...

lib/
├── cashfree.ts                     # Cashfree utilities & API

hooks/
└── use-cashfree-payment.ts        # React hook for payments

components/
└── checkout-form.tsx              # Updated checkout form
```

## API Endpoints

### Initiate Payment

**POST** `/api/cashfree/initiate`

```json
{
  "order_id": "ORDER_12345",
  "amount": 999,
  "customer_phone": "9876543210",
  "customer_name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order_id": "ORDER_12345",
    "payment_link": "https://cashfree.com/checkout...",
    "cf_order_id": 123456789
  }
}
```

### Payment Webhook

**POST** `/api/cashfree/webhook`

Receives payment status updates from Cashfree.

### Check Payment Status

**GET** `/api/cashfree/webhook?order_id=ORDER_12345`

Returns current payment status for an order.

## Supported Payment Methods

- **Credit/Debit Cards**: Visa, Mastercard, RuPay
- **UPI**: Direct transfer via UPI
- **Digital Wallets**: PayPal, Amazon Pay, Google Pay
- **Net Banking**: All major Indian banks
- **Cash on Delivery**: Handled separately

## Testing

### Test Card Numbers (Sandbox Only)

| Card Type  | Number              | CVV | Expiry |
| ---------- | ------------------- | --- | ------ |
| Visa       | 4111 1111 1111 1111 | 123 | 12/25  |
| Mastercard | 5555 5555 5555 4444 | 123 | 12/25  |
| RuPay      | 6073 9900 0000 0013 | 123 | 12/25  |

**Note**: Use any future date for expiry and any 3-digit number for CVV in sandbox mode.

## Error Handling

The integration includes comprehensive error handling:

1. **Missing Order**: Order not found or doesn't belong to user
2. **Payment Failed**: Transaction declined by bank/gateway
3. **Invalid Credentials**: Environment variables not configured
4. **Webhook Errors**: Failed to process payment status

All errors are logged and displayed to the user.

## Security Best Practices

✅ **Implemented:**

- Environment variables for sensitive data
- Server-side API signature verification
- User authentication checks
- HTTPS enforcement (production)
- Webhook signature validation

✅ **Additional Measures:**

- Never expose `CASHFREE_SECRET_KEY` in frontend
- Always verify order amount before payment
- Use HTTPS in production
- Keep API credentials rotated
- Log all payment transactions

## Troubleshooting

### Issue: "Cashfree SDK not loaded"

**Solution**: Ensure `NEXT_PUBLIC_CASHFREE_APP_ID` is set correctly and website can access Cashfree's CDN.

### Issue: Webhook not received

**Solution**:

- Verify webhook URL in Cashfree dashboard
- Check that your server is accessible from internet
- Enable webhook in dashboard settings
- Check server logs for errors

### Issue: "Order not found"

**Solution**: Ensure order is created first before initiating payment.

### Issue: Payment status not updating

**Solution**:

- Check if webhook is enabled in Cashfree dashboard
- Verify database fields exist (`payment_gateway`, `payment_session_id`)
- Check server logs for webhook processing errors

## Support

- **Cashfree Documentation**: [docs.cashfree.com](https://docs.cashfree.com)
- **Support Email**: support@cashfree.com
- **Support Portal**: [cashfree.com/support](https://cashfree.com/support)

## Integration Checklist

- [ ] Create Cashfree account
- [ ] Get API credentials
- [ ] Add environment variables to `.env.local`
- [ ] Update database schema
- [ ] Configure webhook URL in Cashfree dashboard
- [ ] Test with sandbox credentials
- [ ] Deploy to production
- [ ] Update production environment variables
- [ ] Switch to production credentials

## Next Steps

1. **Test thoroughly** in sandbox mode
2. **Monitor payments** in your dashboard
3. **Handle edge cases** (network failures, timeouts)
4. **Implement reconciliation** for unconfirmed payments
5. **Set up monitoring** and alerts for failed transactions
