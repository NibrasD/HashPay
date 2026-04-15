import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Load environment variables
const MERCHANT_ID = process.env.HASHKEY_MERCHANT_ID;
const API_SECRET = process.env.HASHKEY_API_SECRET;
const API_URL = process.env.HASHKEY_API_URL;

/**
 * Generate HMAC-SHA256 signature required by HashKey Payment APIs
 */
const generateSignature = (payload, secret) => {
  // Sort keys alphabetically if required by HashKey, or stringify based on docs.
  // Assuming a standard payload stringification as a mock signature logic.
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
};

/**
 * Endpoint to initiate a payment via HashKey CaaS (HSP)
 */
app.post('/api/hsp/create-payment', async (req, res) => {
  try {
    const { orderId, amount, token, title } = req.body;

    if (!MERCHANT_ID || MERCHANT_ID === 'YOUR_MERCHANT_ID') {
      return res.status(500).json({ 
        error: 'Backend is missing real HASHKEY_MERCHANT_ID and API_SECRET' 
      });
    }

    const payload = {
      merchantId: MERCHANT_ID,
      orderId: orderId, // The HashPay Invoice ID
      currency: token === '0x0000000000000000000000000000000000000000' ? 'HSK' : 'USDT',
      amount: amount.toString(),
      orderTitle: title || 'Invoice Payment',
      timestamp: Date.now()
    };

    // Calculate signature
    const signature = generateSignature(payload, API_SECRET);

    // Append signature to headers or payload depending on HashKey specs
    const headers = {
      'Content-Type': 'application/json',
      'X-Signature': signature
    };

    /* 
    // Real call when API is active:
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    */

    // MOCK RESPONSE FOR HACKATHON MVP (Pending actual API Key)
    const mockCheckoutUrl = `https://checkout.hashfans.io/pay?order_id=${orderId}&amount=${amount}`;
    
    res.status(200).json({
      success: true,
      checkoutUrl: mockCheckoutUrl,
      signature_generated: signature // For testing display
    });

  } catch (err) {
    console.error('Error creating HSP payment:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Webhook Endpoint to receive payment success confirmation from HashKey
 */
app.post('/api/hsp/webhook', (req, res) => {
  const { orderId, status, signature } = req.body;
  
  // 1. Verify signature from HashKey
  // 2. If valid and status === 'SUCCESS', update the smart contract natively or update DB
  
  console.log(`[Webhook] Received payment update for Order ${orderId}: ${status}`);
  res.status(200).send('OK');
});

// Serve Frontend Static Files (Production)
app.use(express.static(path.join(__dirname, './frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 HashPay Backend running on http://localhost:${PORT}`);
  if (MERCHANT_ID === 'YOUR_MERCHANT_ID') {
    console.warn('⚠️ WARNING: using placeholder API keys. Please update .env!');
  }
});
