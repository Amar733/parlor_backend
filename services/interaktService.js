const axios = require('axios');
const LogService = require('../services/logService');

const INTERAKT_BASE_URL = process.env.INTERAKT_BASE_URL || 'https://api.interakt.ai/v1';

/**
 * Send a WhatsApp message using Interakt API
 * @param {string} phoneNumber - The recipient's phone number with country code
 * @param {string} type - Message type (Template, Text, etc.)
 * @param {object} data - Message data
 */
exports.sendWhatsAppMessage = async (phoneNumber, data) => {
    try {
        if (!process.env.INTERAKT_API_KEY) {
            throw new Error('INTERAKT_API_KEY is not configured');
        }

        // Clean phone number (remove spaces, dashes)
        // If the frontend sends countryCode + phoneNumber, it might come as "+9198...", so we strip the plus.
        let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        // Basic validation/auto-fix only if it looks like a raw 10 digit Indian number without country code
        if (cleanNumber.length === 10) {
            cleanNumber = '91' + cleanNumber;
        }

        const config = {
            method: 'post',
            url: `${INTERAKT_BASE_URL}/public/message/`,
            headers: { 
                'Authorization': `Basic ${process.env.INTERAKT_API_KEY}`, 
                'Content-Type': 'application/json'
            },
            data: {
                fullPhoneNumber: cleanNumber,
                ...data
            }
        };

        const response = await axios(config);
        
        return {
            success: true,
            data: response.data
        };

    } catch (error) {
        console.error('Interakt API Error:', error.response?.data || error.message);
        
        // Log the failure
        await LogService.logActivity({
            actor: { id: 'system', name: 'System' },
            action: 'WHATSAPP_SEND_FAILURE',
            entity: {
                type: 'ExternalAPI',
                name: 'Interakt'
            },
            details: {
                error: error.response?.data || error.message,
                phoneNumber
            }
        });

        // Return error but don't crash app
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
};
