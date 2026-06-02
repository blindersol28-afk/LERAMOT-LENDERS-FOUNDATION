import express from 'express';
import path from 'path';
import axios from 'axios';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './database';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(bodyParser.json());

// Payhero API Integration (Lipa Na M-pesa Gateway)
// API documentation: https://payherokenya.com/docs
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Temporary diagnostic endpoint — remove after debugging
app.get('/api/debug/payhero', async (req, res) => {
  const apiKey = process.env.PAYHERO_API_KEY || getSetting('API_PASSWORD', getSetting('PAYHERO_API_KEY', null));
  const channelId = process.env.PAYHERO_CHANNEL_ID || getSetting('ACCOUNT_ID', getSetting('PAYHERO_CHANNEL_ID', null));
  const username = process.env.PAYHERO_USERNAME || getSetting('API_USERNAME', getSetting('PAYHERO_USERNAME', null));
  const credentialSource = process.env.PAYHERO_API_KEY ? 'env' : 'db';
  const authB64 = Buffer.from(`${username}:${apiKey}`).toString('base64');
  try {
    const response = await axios.post('https://backend.payhero.co.ke/api/v2/payments', {
      amount: 1,
      phone_number: '254712113315',
      channel_id: Number(channelId),
      provider: 'm-pesa',
      external_reference: 'DEBUG-TEST-001',
      callback_url: `https://${req.get('host')}/api/payhero/callback`
    }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authB64}` },
      timeout: 15000
    });
    res.json({ success: true, status: response.status, data: response.data, authUsed: `${username}:${apiKey?.slice(0,4)}...`, credentialSource });
  } catch (err: any) {
    res.json({ success: false, httpStatus: err.response?.status, payheroResponse: err.response?.data, errorMessage: err.message, authUsed: `${username}:${apiKey?.slice(0,4)}...`, credentialSource });
  }
});

app.post('/api/applications', (req, res) => {
  const appData = req.body;
  
  if (!appData.firstName || !appData.lastName || !appData.phoneNumber || !appData.idNumber) {
    return res.status(400).json({ error: 'Missing required application fields' });
  }

  const id = Math.random().toString(36).substr(2, 9);
  
  try {
    const stmt = db.prepare(`
      INSERT INTO applications (id, purpose, amount, fundingSource, firstName, lastName, birthday, email, phoneNumber, guarantorNumber, idNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      appData.purpose,
      appData.amount,
      appData.fundingSource,
      appData.firstName,
      appData.lastName,
      appData.birthday,
      appData.email,
      appData.phoneNumber,
      appData.guarantorNumber,
      appData.idNumber
    );
    
    res.status(201).json({ message: 'Application received', id });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to save application' });
  }
});

// Helper function to query persisted settings from SQLite with an optional environment variable fallback
function getSetting(key: string, envFallback?: string): string | null {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
    if (row && row.value) {
      return row.value;
    }
  } catch (error) {
    console.error(`Error querying settings for key ${key}:`, error);
  }
  return envFallback || null;
}

const PAYHERO_ENDPOINT = 'https://backend.payhero.co.ke/api/v2/payments';
const PAYHERO_STATUS_ENDPOINT = 'https://backend.payhero.co.ke/api/v2/transaction-status';

async function postToPayhero(payload: any, authB64: string) {
  console.log('[Payhero API] Initiating STK push:', { ...payload });
  return axios.post(PAYHERO_ENDPOINT, payload, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${authB64}` },
    timeout: 30000
  });
}

// Payhero STK Push initiator
app.post('/api/payhero/stkpush', async (req, res) => {
  const { phoneNumber, amount, accountReference, applicationData } = req.body;
  
  if (!phoneNumber || !amount || !applicationData) {
    return res.status(400).json({ error: 'Missing required fields: phoneNumber, amount, and applicationData are required' });
  }

  // Format phone number to 254XXXXXXXXX
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.length === 9) {
    formattedPhone = '254' + formattedPhone;
  } else if (formattedPhone.startsWith('254') && formattedPhone.length === 12) {
    // Already correct
  } else if (formattedPhone.length > 12 && formattedPhone.includes('254')) {
    formattedPhone = formattedPhone.substring(formattedPhone.indexOf('254'), formattedPhone.indexOf('254') + 12);
  }

  const apiKey = process.env.PAYHERO_API_KEY || getSetting('API_PASSWORD', getSetting('PAYHERO_API_KEY', null));
  const channelId = process.env.PAYHERO_CHANNEL_ID || getSetting('ACCOUNT_ID', getSetting('PAYHERO_CHANNEL_ID', null));
  const username = process.env.PAYHERO_USERNAME || getSetting('API_USERNAME', getSetting('PAYHERO_USERNAME', null));

  if (!apiKey || !channelId || !username) {
    return res.status(500).json({ error: 'Payhero configuration (API Username, API password, and account ID) is incomplete on the server.' });
  }

  const callbackUrl = getSetting('APP_URL', process.env.APP_URL) ||
    `https://${req.get('host')}/api/payhero/callback`;

  const authB64 = Buffer.from(`${username}:${apiKey}`).toString('base64');

  try {
    const externalRef = accountReference || `LERAMOT-${applicationData?.idNumber || Date.now()}`;
    const payload = {
      amount: Number(amount),
      phone_number: formattedPhone,
      channel_id: Number(channelId),
      provider: 'm-pesa',
      external_reference: externalRef,
      callback_url: callbackUrl
    };

    console.log('Sending request to Payhero API:', payload);

    const response = await postToPayhero(payload, authB64);

    console.log('Payhero API Response:', response.data);

    // Extract an identifier for polling or webhook verification
    const checkoutRequestID = response.data.checkout_request_id || response.data.CheckoutRequestID || response.data.reference || response.data.transaction_id || `PH-${Math.random().toString(36).substring(2, 9)}`;
    
    // Save application and payment to DB
    const applicationId = Math.random().toString(36).substr(2, 9);
    
    db.transaction(() => {
      // Save application
      const appStmt = db.prepare(`
        INSERT INTO applications (id, purpose, amount, fundingSource, firstName, lastName, birthday, email, phoneNumber, guarantorNumber, idNumber)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      appStmt.run(
        applicationId,
        applicationData.purpose,
        applicationData.amount,
        applicationData.fundingSource,
        applicationData.firstName,
        applicationData.lastName,
        applicationData.birthday,
        applicationData.email,
        applicationData.phoneNumber,
        applicationData.guarantorNumber,
        applicationData.idNumber
      );

      // Save payment
      const payStmt = db.prepare(`
        INSERT INTO payments (checkoutRequestID, applicationId, amount, status)
        VALUES (?, ?, ?, ?)
      `);
      payStmt.run(checkoutRequestID, applicationId, amount, 'pending');
    })();

    res.json({ 
      message: 'STK Push initiated successfully via Payhero', 
      checkoutRequestID,
      customerMessage: response.data.message || response.data.CustomerMessage || 'Please check your phone for the M-pesa prompt'
    });

  } catch (error: any) {
    const payheroMode = process.env.PAYHERO_MODE || getSetting('PAYHERO_MODE', 'sandbox');
    if (payheroMode === 'live') {
      console.error('[Payhero Live] Request failed:', error.response?.data || error.message);
      return res.status(error.response?.status || 500).json({
        error: 'Live payment request failed on your Payhero Kenya gateway account.',
        details: error.response?.data ? JSON.stringify(error.response.data) : error.message || 'Check your credentials or channel configuration on Payhero Setup.'
      });
    }

    console.log('[Payhero Sandbox] Processing checkout via sandbox flow fallback.');
    
    // Generate a sandbox mock checkout identifier so the user can complete the flow
    const checkoutRequestID = `PHS-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const mockAppId = Math.random().toString(36).substring(2, 11);
    
    try {
      db.transaction(() => {
        // Save mock application
        const appStmt = db.prepare(`
          INSERT INTO applications (id, purpose, amount, fundingSource, firstName, lastName, birthday, email, phoneNumber, guarantorNumber, idNumber, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        appStmt.run(
          mockAppId,
          applicationData.purpose || 'Personal Loan',
          Number(applicationData.amount || 5000),
          applicationData.fundingSource || 'Salary',
          applicationData.firstName,
          applicationData.lastName,
          applicationData.birthday || null,
          applicationData.email || null,
          applicationData.phoneNumber,
          applicationData.guarantorNumber || '',
          applicationData.idNumber,
          'pending'
        );

        // Save mock payment
        const payStmt = db.prepare(`
          INSERT INTO payments (checkoutRequestID, applicationId, amount, status, paymentType)
          VALUES (?, ?, ?, ?, ?)
        `);
        payStmt.run(checkoutRequestID, mockAppId, Number(amount), 'pending', 'insurance_fee');
      })();

      res.json({ 
        message: 'STK Push initiated successfully (SANDBOX SIMULATION MODE)', 
        checkoutRequestID,
        customerMessage: 'SIMULATION: Payhero credentials or channel is unconfigured or failed. Go to Admin Portal / Payhero Setup to process payment code ' + checkoutRequestID,
        isSimulated: true
      });
    } catch (dbError: any) {
      console.error('Database save error during fallback:', dbError);
      res.status(500).json({ error: 'Failed to initiate STK Push and database fallback.', details: error.message });
    }
  }
});

// Callback/webhook endpoint for Payhero
app.post('/api/payhero/callback', (req, res) => {
  console.log('Received Payhero Webhook:', req.body);
  
  const checkoutRequestID = req.body.checkout_request_id || req.body.CheckoutRequestID || req.body.reference || req.body.Reference;
  const status = (req.body.status === 'Success' || req.body.status === 'success' || req.body.ResultCode === 0 || req.body.status_code === '200') ? 'success' : 'failed';
  const mpesaReceiptNumber = req.body.mpesa_code || req.body.MpesaReceiptNumber || req.body.transaction_id || req.body.mpesaReceiptNumber || null;

  if (!checkoutRequestID) {
    console.warn('Callback missing identifier/reference');
    return res.status(400).json({ error: 'Callback missing checkoutRequestID or reference identifier' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE payments 
      SET status = ?, mpesaReceiptNumber = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE checkoutRequestID = ?
    `);
    const info = stmt.run(status, mpesaReceiptNumber, checkoutRequestID);
    
    if (info.changes === 0) {
      console.warn(`No payment entry found matching request ID: ${checkoutRequestID}`);
    } else {
      console.log(`Payment updated to ${status} for request ID: ${checkoutRequestID}`);
    }
  } catch (error) {
    console.error('Callback database error:', error);
  }

  res.json({ status: 'success', message: 'Webhook processed' });
});

// Status polling endpoint
app.get('/api/payhero/status/:checkoutRequestID', async (req, res) => {
  const { checkoutRequestID } = req.params;

  try {
    const payment = db.prepare('SELECT * FROM payments WHERE checkoutRequestID = ?').get(checkoutRequestID) as any;

    if (!payment) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (payment.status === 'pending') {
      try {
        const apiKey = process.env.PAYHERO_API_KEY || getSetting('API_PASSWORD', getSetting('PAYHERO_API_KEY', null));
        const username = process.env.PAYHERO_USERNAME || getSetting('API_USERNAME', getSetting('PAYHERO_USERNAME', null));
        if (apiKey && username) {
          const authB64 = Buffer.from(`${username}:${apiKey}`).toString('base64');
          const statusRes = await axios.get(PAYHERO_STATUS_ENDPOINT, {
            params: { checkout_request_id: checkoutRequestID },
            headers: { Authorization: `Basic ${authB64}` },
            timeout: 10000
          });
          const live = statusRes.data;
          if (live.status === 'Success' || live.ResultCode === 0) {
            db.prepare('UPDATE payments SET status=?, mpesaReceiptNumber=?, updatedAt=CURRENT_TIMESTAMP WHERE checkoutRequestID=?')
              .run('success', live.MpesaReceiptNumber || null, checkoutRequestID);
            return res.json({ ...payment, status: 'success', mpesaReceiptNumber: live.MpesaReceiptNumber || null });
          } else if (live.status === 'Failed' || (live.ResultCode !== undefined && live.ResultCode !== 0)) {
            db.prepare('UPDATE payments SET status=?, updatedAt=CURRENT_TIMESTAMP WHERE checkoutRequestID=?')
              .run('failed', checkoutRequestID);
            return res.json({ ...payment, status: 'failed' });
          }
        }
      } catch (_) { /* fall through to DB value if live check fails */ }
    }

    res.json(payment);
  } catch (error) {
    console.error('Status polling database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin config endpoint to retrieve active setting status
app.get('/api/payhero/config', (req, res) => {
  const rawApiKey = (process.env.PAYHERO_API_KEY || getSetting('API_PASSWORD', getSetting('PAYHERO_API_KEY', null))) || '';
  const maskedApiKey = rawApiKey
    ? (rawApiKey.length > 8 ? `${rawApiKey.slice(0, 4)}...${rawApiKey.slice(-4)}` : '********')
    : '';

  res.json({
    apiKey: maskedApiKey,
    isApiKeySet: !!rawApiKey,
    channelId: (process.env.PAYHERO_CHANNEL_ID || getSetting('ACCOUNT_ID', getSetting('PAYHERO_CHANNEL_ID', null))) || '',
    username: (process.env.PAYHERO_USERNAME || getSetting('API_USERNAME', getSetting('PAYHERO_USERNAME', null))) || '',
    appUrl: getSetting('APP_URL', process.env.APP_URL) || '',
    mode: process.env.PAYHERO_MODE || getSetting('PAYHERO_MODE', 'sandbox'),
  });
});

// Admin config endpoint to clear all settings from the database
app.post('/api/payhero/config/clear', (req, res) => {
  try {
    db.prepare('DELETE FROM settings').run();
    res.json({ status: 'success', message: 'All saved credentials have been successfully cleared from the database.' });
  } catch (error: any) {
    console.error('Error clearing settings:', error);
    res.status(500).json({ error: 'Failed to clear settings from database' });
  }
});

// Admin config endpoint to persist settings to the SQLite DB
app.post('/api/payhero/config', (req, res) => {
  const { apiKey, channelId, username, appUrl, mode } = req.body;
  
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    if (apiKey && !apiKey.includes('...')) {
      stmt.run('API_PASSWORD', apiKey.trim());
      stmt.run('PAYHERO_API_KEY', apiKey.trim()); // legacy sync
    }
    if (channelId !== undefined) {
      stmt.run('ACCOUNT_ID', String(channelId).trim());
      stmt.run('PAYHERO_CHANNEL_ID', String(channelId).trim()); // legacy sync
    }
    if (username !== undefined) {
      stmt.run('API_USERNAME', String(username).trim());
      stmt.run('PAYHERO_USERNAME', String(username).trim()); // legacy sync
    }
    if (appUrl !== undefined) {
      stmt.run('APP_URL', String(appUrl).trim());
    }
    if (mode !== undefined) {
      stmt.run('PAYHERO_MODE', String(mode).trim());
    }
    
    res.json({ status: 'success', message: 'Payhero settings updated successfully' });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings to database' });
  }
});

// Fetch historical payments list for dashboard
app.get('/api/payhero/payments', (req, res) => {
  try {
    const list = db.prepare(`
      SELECT p.*, a.firstName, a.lastName, a.phoneNumber, a.idNumber, a.purpose
      FROM payments p
      LEFT JOIN applications a ON p.applicationId = a.id
      ORDER BY p.createdAt DESC
    `).all();
    res.json(list);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search applications and payments for user loan-center
app.get('/api/loans/search', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Search query (ID or phone number) is required' });
  }

  const cleanQuery = String(query).replace(/\s/g, '').trim();
  const digits = cleanQuery.replace(/\D/g, '');

  try {
    const applications = db.prepare(`
      SELECT * FROM applications 
      WHERE idNumber = ? OR phoneNumber LIKE ? OR phoneNumber LIKE ?
      ORDER BY createdAt DESC
    `).all(
      cleanQuery, 
      `%${cleanQuery}%`,
      `%${digits}%`
    );

    const result = applications.map((app: any) => {
      const payments = db.prepare(`
        SELECT * FROM payments 
        WHERE applicationId = ?
        ORDER BY createdAt DESC
      `).all(app.id);
      return {
        ...app,
        payments
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search applications' });
  }
});

// Enable/Disable autoPay
app.post('/api/loans/toggle-autopay', (req, res) => {
  const { applicationId, autoPay } = req.body;
  
  if (!applicationId) {
    return res.status(400).json({ error: 'applicationId is required' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE applications 
      SET autoPay = ? 
      WHERE id = ?
    `);
    const info = stmt.run(autoPay ? 1 : 0, applicationId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ status: 'success', message: 'Auto-pay preference updated successfully', autoPay: !!autoPay });
  } catch (error) {
    console.error('Error toggling autopay:', error);
    res.status(500).json({ error: 'Failed to toggle autopay setting' });
  }
});

// Developer update status endpoint (for easy validation and test-flows)
app.post('/api/loans/update-status', (req, res) => {
  const { applicationId, status } = req.body;
  
  if (!applicationId || !status) {
    return res.status(400).json({ error: 'applicationId and status are required' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE applications 
      SET status = ? 
      WHERE id = ?
    `);
    const info = stmt.run(status, applicationId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ status: 'success', message: `Application status updated to ${status}` });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Directly submit a new loan application from dashboard
app.post('/api/loans/submit', (req, res) => {
  const { purpose, amount, fundingSource, firstName, lastName, birthday, email, phoneNumber, guarantorNumber, idNumber } = req.body;
  
  if (!firstName || !lastName || !phoneNumber || !idNumber || !amount) {
    return res.status(400).json({ error: 'Missing required application fields' });
  }

  const id = Math.random().toString(36).substring(2, 11);
  const status = 'pending';

  try {
    const stmt = db.prepare(`
      INSERT INTO applications (id, purpose, amount, fundingSource, firstName, lastName, birthday, email, phoneNumber, guarantorNumber, idNumber, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      purpose || 'Personal Loan',
      Number(amount),
      fundingSource || 'Salary',
      firstName,
      lastName,
      birthday || null,
      email || null,
      phoneNumber,
      guarantorNumber || '',
      idNumber,
      status
    );

    res.status(201).json({ status: 'success', message: 'Loan application submitted successfully!', id });
  } catch (error) {
    console.error('Error submitting loan application:', error);
    res.status(500).json({ error: 'Failed to submit loan application' });
  }
});

// Trigger repayment STK push
app.post('/api/loans/repay', async (req, res) => {
  const { applicationId, phoneNumber, amount } = req.body;
  
  if (!applicationId || !phoneNumber || !amount) {
    return res.status(400).json({ error: 'Missing required fields: applicationId, phoneNumber, and amount are required' });
  }

  // Format phone number
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.length === 9) {
    formattedPhone = '254' + formattedPhone;
  }

  const apiKey = process.env.PAYHERO_API_KEY || getSetting('API_PASSWORD', getSetting('PAYHERO_API_KEY', null));
  const channelId = process.env.PAYHERO_CHANNEL_ID || getSetting('ACCOUNT_ID', getSetting('PAYHERO_CHANNEL_ID', null));
  const username = process.env.PAYHERO_USERNAME || getSetting('API_USERNAME', getSetting('PAYHERO_USERNAME', null));

  if (!apiKey || !channelId || !username) {
    return res.status(500).json({ error: 'Payhero credentials missing or incomplete. Go to Payhero Setup to set them.' });
  }

  const callbackUrl = getSetting('APP_URL', process.env.APP_URL) ||
    `https://${req.get('host')}/api/payhero/callback`;

  const authB64 = Buffer.from(`${username}:${apiKey}`).toString('base64');

  try {
    const payload = {
      amount: Number(amount),
      phone_number: formattedPhone,
      channel_id: Number(channelId),
      provider: 'm-pesa',
      external_reference: `REPAY-${applicationId.toUpperCase()}`,
      callback_url: callbackUrl
    };

    console.log('Sending repayment request to Payhero API:', payload);

    const response = await postToPayhero(payload, authB64);

    console.log('Payhero API Response:', response.data);

    const checkoutRequestID = response.data.checkout_request_id || response.data.CheckoutRequestID || response.data.reference || response.data.transaction_id || `PHR-${Math.random().toString(36).substring(2, 9)}`;

    const payStmt = db.prepare(`
      INSERT INTO payments (checkoutRequestID, applicationId, amount, status, paymentType)
      VALUES (?, ?, ?, ?, ?)
    `);
    payStmt.run(checkoutRequestID, applicationId, Number(amount), 'pending', 'loan_repayment');

    res.json({ 
      status: 'success',
      message: 'STK push initiated successfully', 
      checkoutRequestID,
      customerMessage: response.data.message || response.data.CustomerMessage || 'Please check your phone for the M-pesa authorization'
    });

  } catch (error: any) {
    const payheroMode = process.env.PAYHERO_MODE || getSetting('PAYHERO_MODE', 'sandbox');
    if (payheroMode === 'live') {
      console.error('[Payhero Live] Repayment request failed:', error.response?.data || error.message);
      return res.status(error.response?.status || 500).json({
        error: 'Live loan repayment request failed on your Payhero Kenya gateway account.',
        details: error.response?.data ? JSON.stringify(error.response.data) : error.message || 'Check your credentials or channel configuration on Payhero Setup.'
      });
    }

    console.log('[Payhero Sandbox] Processing repayment via sandbox flow fallback.');
    
    // Generate sandbox mock repayment checkout identifier that works immediately
    const checkoutRequestID = `PHR-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    try {
      const payStmt = db.prepare(`
        INSERT INTO payments (checkoutRequestID, applicationId, amount, status, paymentType)
        VALUES (?, ?, ?, ?, ?)
      `);
      payStmt.run(checkoutRequestID, applicationId, Number(amount), 'pending', 'loan_repayment');

      res.json({ 
        status: 'success',
        message: 'STK push initiated successfully (SANDBOX SIMULATION MODE)', 
        checkoutRequestID,
        customerMessage: 'SIMULATION: Payhero credentials or channel is unconfigured or failed. Go to Admin Portal / Payhero Setup to process payment code ' + checkoutRequestID,
        isSimulated: true
      });
    } catch (dbError: any) {
      console.error('Database save error during repayment fallback:', dbError);
      res.status(500).json({ error: 'Failed to trigger M-PESA repayment push and database fallbacks.', details: error.message });
    }
  }
});

// Developer/Admin Callback Simulation (Bypasses external webhook requirement for easier testing in sandboxed environments)
app.post('/api/payhero/simulate-callback', (req, res) => {
  const { checkoutRequestID, status, mpesaReceiptNumber } = req.body;
  
  if (!checkoutRequestID) {
    return res.status(400).json({ error: 'checkoutRequestID is required' });
  }
  
  const finalStatus = status || 'success';
  const finalReceipt = mpesaReceiptNumber || `MP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  
  try {
    const stmt = db.prepare(`
      UPDATE payments 
      SET status = ?, mpesaReceiptNumber = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE checkoutRequestID = ?
    `);
    const info = stmt.run(finalStatus, finalReceipt, checkoutRequestID);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Transaction matching checkoutRequestID not found' });
    }
    
    res.json({ status: 'success', message: `Successfully simulated ${finalStatus} callback for ${checkoutRequestID}` });
  } catch (error: any) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Failed to simulate callback' });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
