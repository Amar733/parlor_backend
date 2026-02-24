const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { auth } = require('../middleware/auth');

// Purchase Routes
router.get('/', auth, purchaseController.getPurchases);
router.post('/', auth, purchaseController.createPurchase);
router.post('/bulk', purchaseController.createPurchaseBills);
router.post('/bulk-details', purchaseController.getBulkPurchaseDetails);
router.patch('/bulk-payment', purchaseController.bulkUpdatePaymentStatus);
router.delete('/bulk', purchaseController.deleteAllPurchaseData);
router.get('/:id', auth, purchaseController.getPurchaseById);
router.put('/:id', auth, purchaseController.updatePurchaseWithStockManagement);
router.delete('/:id', auth, purchaseController.deletePurchase);
router.patch('/:id/payment', auth, purchaseController.updatePaymentStatus);
router.get('/:id/invoice', auth, purchaseController.generatePurchaseInvoice);

module.exports = router;