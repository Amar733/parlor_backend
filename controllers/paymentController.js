const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Ledger = require('../models/Ledger');
const DoctorEarning = require('../models/DoctorEarning');
const Appointment = require('../models/Appointment');
const ManagedUser = require('../models/ManagedUser');
const axios = require('axios');

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️ Razorpay keys are missing. Payment features will be disabled.');
}

/**
 * Creates a Razorpay order
 */
exports.createOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.user.id; 

    if (!razorpay) {
      return res.status(503).json({ message: 'Razorpay integration is not configured on the server.' });
    }

    if (!appointmentId) {
      return res.status(400).json({ message: 'AppointmentId is required' });
    }

    // Fetch appointment to get doctorId and check if it exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const doctorId = appointment.doctorId;
    if (!doctorId) {
      return res.status(400).json({ message: 'No doctor associated with this appointment' });
    }

    // Fetch doctor to get official fees
    const doctor = await ManagedUser.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const amount = doctor.fees || 500; // Fallback only if fees not defined in DB

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `RCPT_${appointmentId.substring(0, 10)}_${Date.now()}`,
      notes: {
        userId,
        doctorId: doctorId.toString(),
        appointmentId
      }
    };

    const order = await razorpay.orders.create(options);

    // Save initial payment record
    const newPayment = new Payment({
      orderId: order.id,
      amount: options.amount,
      userId,
      doctorId,
      appointmentId,
      status: 'pending'
    });
    await newPayment.save();

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    res.status(500).json({ message: 'Failed to create payment order', error: error.message });
  }
};


/**
 * Creates a Registration Fee Order (Public)
 */
exports.createRegistrationOrder = async (req, res) => {
  try {
    const { feeId, name, email, contact, amount } = req.body;

    if (!razorpay) {
      return res.status(503).json({ message: 'Razorpay integration is not configured.' });
    }

    // validate fee package
    // We import Charge model inside function or at top if not present. 
    // Assuming Charge is needed, let's add it if missing at top, but for now using direct logic.
    const Charge = require('../models/Utility');
    const feePackage = await Charge.findById(feeId);
    
    if (!feePackage) {
      return res.status(404).json({ message: 'Invalid fee package selected' });
    }

    // Verify amount matches standard or is valid
    // We trust the DB amount over frontend amount
    const feeAmount = feePackage.charge; 

    const options = {
      amount: Math.round(feeAmount * 100), // paise
      currency: 'INR',
      receipt: `REG_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        type: 'registration',
        feeId: feeId,
        name: name || '',
        email: email || '',
        contact: contact || ''
      }
    };

    const order = await razorpay.orders.create(options);

    // Save initial payment record
    const newPayment = new Payment({
      orderId: order.id,
      amount: options.amount,
      type: 'registration',
      payerDetails: { name, email, contact },
      feePackageId: feeId,
      status: 'pending'
    });
    await newPayment.save();

    res.status(201).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: "99Clinix Registration",
      description: feePackage.name
    });

  } catch (error) {
    console.error('Registration Order Error:', error);
    res.status(500).json({ message: 'Failed to create registration order', error: error.message });
  }
};

/**
 * Internally handle payment success (Shared by Webhook and Manual Verify)
 */
async function processPaymentSuccess(paymentData) {
    const { id: paymentId, order_id: orderId, amount, method, notes } = paymentData;
    console.log(`[Payment Processing] Processing success for Order: ${orderId}, Payment: ${paymentId}`);

    try {
        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            console.error('[Payment Processing] Payment record not found for Order ID:', orderId);
            return { success: false, message: 'Payment record not found' };
        }

        if (payment.status === 'captured') {
            console.log('[Payment Processing] Payment already captured, skipping.');
            return { success: true, message: 'Payment already captured' };
        }

        // --- 1. DB UPDATES (CRITICAL) ---
        payment.paymentId = paymentId;
        payment.status = 'captured';
        payment.method = method || 'online';
        payment.signature = 'VERIFIED';
        await payment.save();
        console.log('[Payment Processing] Payment status updated to captured.');

        // Create Ledger entry based on payment type
        const totalAmount = payment.amount;
        const isRegistration = payment.type === 'registration';
        
        const platformLedger = new Ledger({
            entityId: new mongoose.Types.ObjectId('000000000000000000000000'),
            entityType: 'Platform',
            transactionType: 'credit',
            amount: totalAmount,
            purpose: isRegistration ? 'registration_fee' : 'consultation',
            referenceId: payment._id,
            referenceModel: 'Payment',
            description: isRegistration 
                ? `Registration fee from ${payment.payerDetails?.name || 'Doctor'}` 
                : `Funds held for appointment ${payment.appointmentId || 'payment'}`
        });
        await platformLedger.save();
        console.log(`[Payment Processing] Platform ledger updated (${isRegistration ? 'Registration' : 'Consultation'}).`);

        // Update Appointment status
        let appointment = null;
        if (payment.appointmentId) {
            console.log(`[Payment Processing] Updating appointment ${payment.appointmentId} to Confirmed...`);
            
            // Fetch first to check type and existing meeting
            appointment = await Appointment.findById(payment.appointmentId);
            
            if (appointment) {
                const updates = { status: 'Confirmed' };
                
                // FALLBACK: Generate meeting link if missing for online appointments
                if (appointment.type === 'online' && (!appointment.meeting || !appointment.meeting.linkId)) {
                    const linkId = crypto.randomBytes(8).toString('hex');
                    updates.meeting = {
                        linkId,
                        channel: `consult_${linkId}`,
                        status: 'scheduled',
                        expiresAt: new Date(new Date(`${appointment.date}T${appointment.time}:00`).getTime() + 60 * 60 * 1000)
                    };
                    console.log(`[Payment Processing] Fallback: Generated meeting link ${linkId} for appointment ${appointment._id}`);
                }

                appointment = await Appointment.findByIdAndUpdate(payment.appointmentId, updates, { new: true })
                    .populate('patientId')
                    .populate('doctorId');
                
                console.log(`[Payment Processing] Appointment ${payment.appointmentId} updated. Status: ${appointment?.status}`);
            } else {
                console.error(`[Payment Processing] Appointment ${payment.appointmentId} not found during status update.`);
            }
        }

        // --- 2. NOTIFICATIONS (NON-CRITICAL) ---
        if (appointment && appointment.type === 'online') {
            try {
                console.log('[Payment Processing] Attempting WhatsApp notification...');
                const Patient = require('../models/Patient');
                const doctor = await ManagedUser.findById(appointment.doctorId);
                const patient = await Patient.findById(appointment.patientId);

                const cleanDoctorName = doctor?.name || "Doctor";
                const cleanPatientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
                const cleanDate = new Date(appointment.date).toLocaleDateString();
                const cleanTime = appointment.time;
                const meetingLink = `https://app.99clinix.online/meeting/${appointment.meeting?.linkId}`;

                const sendWhatsApp = async (phoneNumber, templateName, bodyValues) => {
                    try {
                        let cleanNumber = phoneNumber.toString().replace(/[^0-9]/g, '');
                        if (cleanNumber.startsWith('91') && cleanNumber.length === 12) cleanNumber = cleanNumber.substring(2);
                        if (cleanNumber.length !== 10) return { success: false, error: 'Invalid phone number' };

                        await axios.post('https://api.interakt.ai/v1/public/message/', {
                            countryCode: "+91",
                            phoneNumber: cleanNumber,
                            type: "Template",
                            template: {
                                name: templateName,
                                languageCode: "en",
                                bodyValues: bodyValues
                            }
                        }, {
                            headers: {
                                'Authorization': `Basic ${process.env.INTERAKT_API_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        return { success: true };
                    } catch (error) {
                        console.error(`[WhatsApp Error] Failed to send to ${phoneNumber}:`, error.message);
                        return { success: false, error: error.message };
                    }
                };

                // Send to Patient
                if (patient && patient.contact) {
                    await sendWhatsApp(patient.contact, "dp_booking_utlity", [
                        cleanDoctorName,
                        cleanTime,
                        cleanDate,
                        meetingLink
                    ]);
                    console.log('[Payment Processing] Notification sent to patient.');
                }

                // Send to Doctor
                if (doctor && doctor.mobileNo) {
                    await sendWhatsApp(doctor.mobileNo, "dr_booking_utlity", [
                        cleanPatientName,
                        cleanTime,
                        cleanDate
                    ]);
                    console.log('[Payment Processing] Notification sent to doctor.');
                }

            } catch (notifyError) {
                console.error('[Payment Processing] Notification failed (Status is NOT affected):', notifyError);
            }
        }

        return { success: true, message: 'Payment processed successfully', payment };
    } catch (error) {
        console.error('[Payment Processing] Error:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Handle Manual Verification from Frontend
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment details' });
        }

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Process Success Logic
        const result = await processPaymentSuccess({
            id: razorpay_payment_id,
            order_id: razorpay_order_id,
            amount: 0, // Amount is verified in DB via orderId in processPaymentSuccess, or we can fetch order
            method: 'online', // Default or fetch from Razorpay API
            notes: {}
        });

        if (result.success) {
            res.status(200).json({ success: true, message: 'Payment verified and processed' });
        } else {
            res.status(404).json({ message: result.message });
        }

    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
};

/**
 * Handles Razorpay Webhooks
 */
exports.handleWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Razorpay Webhook Event:', event);

    try {
        if (event === 'payment.captured') {
            await processPaymentSuccess(payload.payment.entity);
        } else if (event === 'payment.failed') {
            await handlePaymentFailure(payload.payment.entity);
        }
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ message: 'Internal server error processing webhook' });
    }
};




/**
 * Releases funds to Doctor after consultation is complete
 */
exports.releaseDoctorEarning = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findById(paymentId);

    if (!payment || payment.status !== 'captured') {
      return res.status(400).json({ message: 'Invalid or uncaptured payment' });
    }

    // Check if already released
    const existingLedger = await Ledger.findOne({ 
      referenceId: payment._id, 
      entityType: 'Doctor',
      purpose: 'consultation'
    });
    if (existingLedger) {
        return res.status(400).json({ message: 'Earnings already released for this payment' });
    }

    const commissionPercent = 20; 
    const totalAmount = payment.amount; 
    const platformCommission = Math.round(totalAmount * (commissionPercent / 100));
    const doctorShare = totalAmount - platformCommission;

    // Debit Platform Ledger (the held amount)
    const platformDebit = new Ledger({
        entityId: new mongoose.Types.ObjectId('000000000000000000000000'),
        entityType: 'Platform',
        transactionType: 'debit',
        amount: doctorShare, // Releasing doctor share from platform escrow
        purpose: 'consultation',
        referenceId: payment._id,
        referenceModel: 'Payment',
        description: `Released doctor share for payment ${payment.orderId}`
    });
    await platformDebit.save();

    // Credit Doctor Ledger
    const doctorLedger = new Ledger({
      entityId: payment.doctorId,
      entityType: 'Doctor',
      transactionType: 'credit',
      amount: doctorShare,
      purpose: 'consultation',
      referenceId: payment._id,
      referenceModel: 'Payment',
      description: `Earnings from consultation ${payment.appointmentId || ''}`
    });
    await doctorLedger.save();

    // Update DoctorEarning summary
    await DoctorEarning.findOneAndUpdate(
      { doctorId: payment.doctorId },
      { 
        $inc: { 
          totalEarned: doctorShare,
          totalCommission: platformCommission,
          withdrawableBalance: doctorShare
        },
        $set: { lastTransactionAt: new Date() }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Funds released to doctor' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to release funds', error: error.message });
  }
};

/**
 * Processes a refund via Razorpay
 */
exports.processRefund = async (req, res) => {
    try {
        const { paymentId, amount, notes } = req.body;
        const payment = await Payment.findById(paymentId);

        if (!payment || payment.status !== 'captured') {
            return res.status(400).json({ message: 'Payment not found or not captured' });
        }

        if (!razorpay) {
            return res.status(503).json({ message: 'Razorpay integration is not configured on the server.' });
        }

        const refund = await razorpay.payments.refund(payment.paymentId, {
            amount: (amount || (payment.amount / 100)) * 100, // Refund full or partial
            notes: notes || { reason: 'Consultation cancelled' }
        });

        // Update Payment record
        payment.status = 'refunded';
        payment.refunds.push({
            refundId: refund.id,
            amount: refund.amount,
            status: refund.status,
            createdAt: new Date()
        });
        await payment.save();

        // Ledger Entry for Refund (Debit Platform)
        const refundLedger = new Ledger({
            entityId: new mongoose.Types.ObjectId('000000000000000000000000'),
            entityType: 'Platform',
            transactionType: 'debit',
            amount: refund.amount,
            purpose: 'refund',
            referenceId: payment._id,
            referenceModel: 'Payment',
            description: `Refund processed for payment ${payment.paymentId}`
        });
        await refundLedger.save();

        res.status(200).json({ success: true, refund });
    } catch (error) {
        console.error('Refund Error:', error);
        res.status(500).json({ message: 'Failed to process refund', error: error.message });
    }
};

async function handlePaymentFailure(paymentData) {
  const { order_id: orderId } = paymentData;
  await Payment.findOneAndUpdate({ orderId }, { status: 'failed' });
}

/**
 * Fetch earnings for a specific doctor
 */
exports.getDoctorEarnings = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    
    // RBAC: Only admin or the doctor themselves can view this data
    if (req.user.role !== 'admin' && req.user._id.toString() !== doctorId) {
      return res.status(403).json({ message: 'Access denied: You can only view your own earnings' });
    }

    const earnings = await DoctorEarning.findOne({ doctorId }).populate('doctorId', 'name email');
    
    if (!earnings) {
      return res.status(404).json({ message: 'Earnings data not found' });
    }

    const recentTransactions = await Ledger.find({ entityId: doctorId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      earnings,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch earnings', error: error.message });
  }
};

/**
 * Admin: Fetch all transactions and aggregate stats
 */
exports.getAllTransactions = async (req, res) => {
    try {
        // RBAC: Only admin can view all transactions
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admin only' });
        }

        const { doctorId, startDate, endDate, status } = req.query;
        let query = {};

        if (doctorId) query.doctorId = doctorId;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Payment.find(query).sort({ createdAt: -1 }).limit(100);
        
        // Detailed aggregation for stats
        const statsAggregation = await Ledger.aggregate([
            {
                $group: {
                    _id: { entityType: "$entityType", purpose: "$purpose", type: "$transactionType" },
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        let totalRevenue = 0;
        let totalCommission = 0;
        let heldInEscrow = 0;

        // Process Aggregation Results
        statsAggregation.forEach(stat => {
            const { entityType, purpose, type } = stat._id;
            const amount = stat.totalAmount;

            if (entityType === 'Platform') {
                if (purpose === 'registration_fee' && type === 'credit') {
                    totalRevenue += amount;
                }
                if (purpose === 'consultation') {
                    if (type === 'credit') heldInEscrow += amount; // Add to escrow
                    if (type === 'debit') heldInEscrow -= amount; // Released from escrow
                }
                // Commission is implicit surplus in consultation credits? 
                // Alternatively, we can calculate generalized commission as (Total Consultation Credit - Total Consultation Debit - Remaining Escrow Liability)
                // But simplified: "heldInEscrow" captures the Pending Payouts.
                // Revenue from commissions is realized only when payout happens? 
                // For now, let's keep Commission separate if explicitly tracked, or assume 20% of released funds?
                // Let's rely on explicit 'commission' ledger if it existed, otherwise 0 for now to avoid guessing.
                if (purpose === 'commission') {
                    totalCommission += amount;
                }
            }
        });
        
        // Ensure non-negative
        heldInEscrow = Math.max(0, heldInEscrow);

        res.status(200).json({
            success: true,
            transactions,
            stats: {
                totalRevenue, // Includes Registration Fees
                totalCommission, 
                heldInEscrow
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch admin stats', error: error.message });
    }
};

/**
 * Admin: Fetch overview of all doctors and their earnings
 */
exports.getDoctorsFinancialOverview = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const doctorsEarnings = await DoctorEarning.find().populate('doctorId', 'name email');
        
        res.status(200).json({
            success: true,
            data: doctorsEarnings
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch doctor overview', error: error.message });
    }
};
