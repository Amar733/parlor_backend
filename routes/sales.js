const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { auth } = require('../middleware/auth');

// Sales Bills Routes
router.get('/bills', auth, salesController.getSalesBills);
router.get('/bills/:id', auth, salesController.getSalesBillById);
router.post('/bills', auth, salesController.createSalesBill);
router.post('/bills/bulk', salesController.createSalesBillBulk);
router.put('/bills/:id', auth, salesController.updateSalesBill);
router.put('/bills/:id/stock-management', auth, salesController.updateSalesWithStockManagementBill);
router.delete('/bills/:id', auth, salesController.deleteSalesBill);
router.patch('/bills/:id/payment', auth, salesController.updatePaymentStatus);
router.get('/bills/:id/invoice', auth, salesController.generateInvoice);

module.exports = router;