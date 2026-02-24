require('dotenv').config();
const interaktService = require('./services/interaktService');

async function testInterakt() {
    console.log('Testing Interakt Service...');
    
    if (!process.env.INTERAKT_API_KEY || process.env.INTERAKT_API_KEY.includes('your_interakt_api_key')) {
        console.warn('WARNING: Interakt API Key is missing or placeholder. Test will likely fail.');
    }

    const phoneNumber = '919876543210'; // Dummy number
    const patientName = 'Test Patient';
    const clinicName = 'Test Clinic';
    const pdfUrl = 'https://example.com/prescription.pdf';

    try {
        const result = await interaktService.sendPrescriptionLink(phoneNumber, patientName, clinicName, pdfUrl);
        console.log('Result:', result);
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testInterakt();
