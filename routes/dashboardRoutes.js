const express = require('express');
const router = express.Router();
const { 
  getSummary, 
  getCategoryTotals, 
  getRecentTransactions, 
  getMonthlyTrends,
  getDailyCounts,
  getMonthlyComparison,
  getWeeklySummary,
  getStreak,
  getDailyCashflow,
  getRecentActivity,
  getTopTransactions,
  getPaymentObligations,
  getTransactionFrequency,
  getDailyNet,
  getSpendingDistribution,
  getAllTransactions,
  getCategoryMonthMatrix,
  getCumulativeSavings,
  getMonthlyExpenseChange,
  getSavingsRateTrend,
  getMoneyFlow
} = require('../controllers/dashboardController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// Analyst and Admin can view summaries
router.get('/summary', authenticateToken, checkRole(['Analyst', 'Admin']), getSummary);
router.get('/category-totals', authenticateToken, checkRole(['Analyst', 'Admin']), getCategoryTotals);
router.get('/recent', authenticateToken, checkRole(['Analyst', 'Admin']), getRecentTransactions);
router.get('/monthly-trends', authenticateToken, checkRole(['Analyst', 'Admin']), getMonthlyTrends);
router.get('/daily-counts', authenticateToken, checkRole(['Analyst', 'Admin']), getDailyCounts);
router.get('/monthly-comparison', authenticateToken, checkRole(['Analyst', 'Admin']), getMonthlyComparison);
router.get('/weekly-summary', authenticateToken, checkRole(['Analyst', 'Admin']), getWeeklySummary);
router.get('/streak', authenticateToken, checkRole(['Analyst', 'Admin']), getStreak);
router.get('/daily-cashflow', authenticateToken, checkRole(['Analyst', 'Admin']), getDailyCashflow);
router.get('/recent-activity', authenticateToken, checkRole(['Analyst', 'Admin']), getRecentActivity);
router.get('/top-transactions', authenticateToken, checkRole(['Analyst', 'Admin']), getTopTransactions);
router.get('/payment-obligations', authenticateToken, checkRole(['Analyst', 'Admin']), getPaymentObligations);
router.get('/transaction-frequency', authenticateToken, checkRole(['Analyst', 'Admin']), getTransactionFrequency);

// Advanced analytics endpoints
router.get('/daily-net', authenticateToken, checkRole(['Analyst', 'Admin']), getDailyNet);
router.get('/spending-distribution', authenticateToken, checkRole(['Analyst', 'Admin']), getSpendingDistribution);
router.get('/all-transactions', authenticateToken, checkRole(['Analyst', 'Admin']), getAllTransactions);
router.get('/category-month-matrix', authenticateToken, checkRole(['Analyst', 'Admin']), getCategoryMonthMatrix);
router.get('/cumulative-savings', authenticateToken, checkRole(['Analyst', 'Admin']), getCumulativeSavings);
router.get('/monthly-expense-change', authenticateToken, checkRole(['Analyst', 'Admin']), getMonthlyExpenseChange);
router.get('/savings-rate-trend', authenticateToken, checkRole(['Analyst', 'Admin']), getSavingsRateTrend);
router.get('/money-flow', authenticateToken, checkRole(['Analyst', 'Admin']), getMoneyFlow);

module.exports = router;
