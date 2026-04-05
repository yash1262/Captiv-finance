const { db } = require('../database');

// Create new financial record
function createRecord(req, res) {
  const { amount, type, category, date, notes } = req.body;

  // Validate required fields
  if (!amount || !type || !category || !date) {
    return res.status(400).json({ error: 'Amount, type, category, and date are required' });
  }

  // Validate type
  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'Type must be income or expense' });
  }

  // Validate amount is a number
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const query = 'INSERT INTO financial_records (amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(query, [amount, type, category, date, notes || '', req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create record' });
    }

    res.status(201).json({
      message: 'Record created successfully',
      recordId: this.lastID
    });
  });
}

// Get all records with optional filters for logged in user
function getRecords(req, res) {
  const userId = req.user.id;
  const { startDate, endDate, category, type } = req.query;

  let query = 'SELECT * FROM financial_records WHERE created_by = ?';
  const params = [userId];

  // Apply filters if provided
  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY date DESC';

  db.all(query, params, (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch records' });
    }
    res.json({ records });
  });
}

// Get single record by ID for logged in user
function getRecordById(req, res) {
  const userId = req.user.id;
  const { recordId } = req.params;

  db.get('SELECT * FROM financial_records WHERE id = ? AND created_by = ?', [recordId, userId], (err, record) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch record' });
    }

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ record });
  });
}

// Update record - only if it belongs to logged in user
function updateRecord(req, res) {
  const userId = req.user.id;
  const { recordId } = req.params;
  const { amount, type, category, date, notes } = req.body;

  // First check if record belongs to user
  db.get('SELECT * FROM financial_records WHERE id = ? AND created_by = ?', [recordId, userId], (err, record) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch record' });
    }

    if (!record) {
      return res.status(404).json({ error: 'Record not found or you do not have permission to update it' });
    }

    // Validate type if provided
    if (type && type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be income or expense' });
    }

    // Validate amount if provided
    if (amount && (isNaN(amount) || amount <= 0)) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];

    if (amount) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (type) {
      updates.push('type = ?');
      params.push(type);
    }
    if (category) {
      updates.push('category = ?');
      params.push(category);
    }
    if (date) {
      updates.push('date = ?');
      params.push(date);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(recordId);
    params.push(userId);
    const query = `UPDATE financial_records SET ${updates.join(', ')} WHERE id = ? AND created_by = ?`;

    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update record' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }

      res.json({ message: 'Record updated successfully' });
    });
  });
}

// Delete record - only if it belongs to logged in user
function deleteRecord(req, res) {
  const userId = req.user.id;
  const { recordId } = req.params;

  // First check if record belongs to user
  db.get('SELECT * FROM financial_records WHERE id = ? AND created_by = ?', [recordId, userId], (err, record) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch record' });
    }

    if (!record) {
      return res.status(404).json({ error: 'Record not found or you do not have permission to delete it' });
    }

    db.run('DELETE FROM financial_records WHERE id = ? AND created_by = ?', [recordId, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete record' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }

      res.json({ message: 'Record deleted successfully' });
    });
  });
}

module.exports = { createRecord, getRecords, getRecordById, updateRecord, deleteRecord };
