const express = require('express');
const router = express.Router();
const { createRecord, getRecords, getRecordById, updateRecord, deleteRecord } = require('../controllers/recordController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// All authenticated users can read records
router.get('/', authenticateToken, getRecords);
router.get('/:recordId', authenticateToken, getRecordById);

// Only Analyst and Admin can create records
router.post('/', authenticateToken, checkRole(['Analyst', 'Admin']), createRecord);

// Only Admin can update or delete records
router.put('/:recordId', authenticateToken, checkRole(['Admin']), updateRecord);
router.delete('/:recordId', authenticateToken, checkRole(['Admin']), deleteRecord);

module.exports = router;
