const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { auth } = require('../middleware/auth');

/* ------------------- EXPENSE CATEGORY ------------------- */
router.get('/expense-categories', auth, financeController.getExpenseCategories);
router.post('/expense-categories', auth, financeController.createExpenseCategory);
router.put('/expense-categories/:id', auth, financeController.updateExpenseCategory);
router.delete('/expense-categories/:id', auth, financeController.deleteExpenseCategory);

/* ------------------- ACCOUNT ------------------- */
router.get('/accounts', auth, financeController.getAccounts);
router.post('/accounts', auth, financeController.createAccount);
router.put('/accounts/:id', auth, financeController.updateAccount);
router.delete('/accounts/:id', auth, financeController.deleteAccount);

/* ------------------- EXPENSE ------------------- */
router.get('/expenses', auth, financeController.getExpenses);
router.get('/expenses/:id', auth, financeController.getExpenseById);
router.post('/expenses', auth, financeController.createExpense);
router.put('/expenses/:id', auth, financeController.updateExpense);
router.delete('/expenses/:id', auth, financeController.deleteExpense);

/* ------------------- PAYTYPE ------------------- */
router.get('/paytypes', auth, financeController.getPayTypes);
router.post('/paytypes', auth, financeController.createPayType);
router.post('/paytypes/bulk', financeController.createPayTypeBulk);
router.put('/paytypes/:id', auth, financeController.updatePayType);
router.delete('/paytypes/:id', auth, financeController.deletePayType);
router.patch('/paytypes/:id/toggle-status', auth, financeController.togglePayTypeStatus);

/* ------------------- DASHBOARD ------------------- */
router.get('/dashboard', auth, financeController.getDashboardStats);
router.get('/top-selling-products', financeController.getTopSellingProducts);
router.get('/sales-summary', financeController.getSalesSummary);

module.exports = router;
    
