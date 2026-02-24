const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { auth } = require('../middleware/auth');

// Get stock by store and product
router.get('/store/:storeId/product/:productId', auth, stockController.getStockByStoreAndProduct);

// Get stock of a product across all stores
router.get('/product/:productId', auth, stockController.getStockByProduct);


router.post('/transfer', auth, stockController.transferStock);


router.get('/get-stock-transactions', auth, stockController.getStockTransactions);
router.get('/get-stock-overview', auth, stockController.getStockOverview);
router.delete('/delete-stock-transaction/:id', auth, stockController.deleteStockTransaction);
router.get('/get-stock-transfers', auth, stockController.getStockTransfers);





module.exports = router;