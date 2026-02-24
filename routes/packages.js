const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { auth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Package Template Routes
router.get('/templates', packageController.getPackages);
router.get('/templates/:id', packageController.getPackageById);
router.post('/templates', packageController.createPackage);
router.put('/templates/:id', packageController.updatePackage);
router.delete('/templates/:id', packageController.deletePackage);

// Customer Subscription Routes
router.get('/subscriptions', packageController.getCustomerSubscriptions);
router.post('/subscriptions', packageController.createCustomerSubscription);
router.put('/subscriptions/:id/payment', packageController.updatePayment);
router.put('/subscriptions/:id/use-service', packageController.useService);
router.get('/subscriptions/:id/invoice', packageController.generateInvoice);
router.put('/subscriptions/:subscriptionId/installments/:installmentId/pay', packageController.payInstallment);
router.delete('/subscriptions/:id', packageController.deleteCustomerSubscription);

module.exports = router;