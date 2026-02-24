const Joi = require('joi');

// Patient validation schema
const patientSchema = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    contact: Joi.string().required().pattern(/^[0-9]{10,15}$/),
    age: Joi.number().integer().min(0).max(150),
    gender: Joi.string().valid('Male', 'Female', 'Other'),
    address: Joi.string().max(200),
    is_primary: Joi.boolean(),
    associated_with_mobile: Joi.boolean()
});

// Appointment validation schema
const appointmentSchema = Joi.object({
    patientId: Joi.string().required(),
    serviceId: Joi.string(),
    doctorId: Joi.string(),
    service: Joi.string().required(),
    doctor: Joi.string().required(),
    date: Joi.string().required(),
    time: Joi.string().required(),
    status: Joi.string().valid('Confirmed', 'Pending', 'Cancelled', 'Completed'),
    notes: Joi.string().max(500)
});

// User registration validation schema
const userRegistrationSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'doctor', 'staff', 'receptionist'),
    specialization: Joi.string().max(100),
    bio: Joi.string().max(500)
});

// User login validation schema
const userLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Service validation schema
const serviceSchema = Joi.object({
    name: Joi.string().required().min(2).max(100),
    description: Joi.string().max(500),
    price: Joi.number().min(0)
});

// Coupon validation schema
const couponSchema = Joi.object({
    code: Joi.string().required().min(3).max(20),
    discount: Joi.number().required().min(0),
    discountType: Joi.string().valid('percentage', 'fixed').required(),
    expiryDate: Joi.string().required(),
    status: Joi.string().valid('Active', 'Expired')
});

// Summary validation schema
const summarySchema = Joi.object({
    date: Joi.string().required(),
    content: Joi.string().required().min(10).max(2000)
});

// Activity log validation schema
const activityLogSchema = Joi.object({
    action: Joi.string().required(),
    entity: Joi.object({
        type: Joi.string().required(),
        id: Joi.string().required(),
        name: Joi.string()
    }).required(),
    details: Joi.object()
});

module.exports = {
    patientSchema,
    appointmentSchema,
    userRegistrationSchema,
    userLoginSchema,
    serviceSchema,
    couponSchema,
    summarySchema,
    activityLogSchema
};
