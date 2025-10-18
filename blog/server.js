const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load environment variables from /etc/environment
function loadEnvFile(filePath) {
    try {
        const envContent = fs.readFileSync(filePath, "utf8");
        const envLines = envContent.split('\n');
        
        envLines.forEach(line => {
            // Skip empty lines and comments
            if (!line.trim() || line.startsWith('#')) {
                return;
            }
            
            // Handle different quote styles and export statements
            const cleanLine = line.replace(/^export\s+/, '').trim();
            const eqIndex = cleanLine.indexOf('=');
            
            if (eqIndex > 0) {
                const key = cleanLine.substring(0, eqIndex).trim();
                let value = cleanLine.substring(eqIndex + 1).trim();
                
                // Remove quotes (both single and double)
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                // Handle escaped characters
                value = value.replace(/\\n/g, '\n')
                             .replace(/\\t/g, '\t')
                             .replace(/\\r/g, '\r')
                             .replace(/\\\\/g, '\\');
                
                process.env[key] = value;
            }
        });
        
        console.log('✓ Environment variables loaded from /etc/environment');
    } catch (error) {
        console.warn('⚠ Could not read /etc/environment:', error.message);
    }
}

// Load environment variables
loadEnvFile('/etc/environment');

// Also load .env file as fallback
require('dotenv').config();

// Verify all required variables are set
const requiredVars = [
    'PORT',
    'RECAPTCHA_SECRET_KEY',
    'GOOGLE_SHEET_ID',
    'GOOGLE_PROJECT_ID',
    'GOOGLE_PRIVATE_KEY_ID',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_PRIVATE_KEY'
];

requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        console.warn(`⚠ Warning: ${varName} is not set`);
    }
});

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google Sheets with credentials from environment variables
const auth = new google.auth.GoogleAuth({
    credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Verify reCAPTCHA
async function verifyRecaptcha(token) {
    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
        });
        const data = await response.json();
        return data.success && data.score > 0.5;
    } catch (error) {
        console.error('reCAPTCHA verification failed:', error);
        return false;
    }
}

// Subscribe endpoint
app.post('/api/subscribe', async (req, res) => {
    try {
        const { name, email, recaptchaToken } = req.body;

        // Validate input
        if (!name || !email || !recaptchaToken) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Verify reCAPTCHA
        const isValid = await verifyRecaptcha(recaptchaToken);
        if (!isValid) {
            return res.status(400).json({ message: 'reCAPTCHA verification failed' });
        }

        // Check if email already exists
        const getResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1!A:B'
        });

        const rows = getResponse.data.values || [];
        const emailExists = rows.some(row => row[1] === email);

        if (emailExists) {
            return res.status(400).json({ message: 'Email already subscribed' });
        }

        // Append to Google Sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[name, email, new Date().toISOString()]]
            }
        });

        res.json({ message: 'Subscription successful' });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(process.env.PORT || 3010, () => {
    console.log(`Server running on port ${process.env.PORT || 3010}`);
});