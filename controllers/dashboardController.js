const { db } = require('../database');

// Get summary statistics for logged in user
function getSummary(req, res) {
  const userId = req.user.id;
  const startDate = req.query.start;
  const endDate = req.query.end;
  
  console.log(`Getting summary for user ${userId}, start: ${startDate}, end: ${endDate}`);
  
  // If no date range provided, get max date and use current month
  if (!startDate || !endDate) {
    db.get(`SELECT MAX(date) as maxDate FROM financial_records WHERE created_by = ?`, [userId], (err, dateResult) => {
      if (err) {
        console.error('Error getting max date:', err);
        return res.status(500).json({ error: 'Failed to get date range' });
      }
      
      const maxDate = dateResult?.maxDate || new Date().toISOString().slice(0, 10);
      const currentMonth = maxDate.slice(0, 7);
      const prevDate = new Date(maxDate);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const previousMonth = prevDate.toISOString().slice(0, 7);
      
      getSummaryWithDates(userId, currentMonth + '-01', maxDate, previousMonth + '-01', currentMonth + '-01', res);
    });
  } else {
    // Calculate previous period for comparison
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff);
    
    getSummaryWithDates(userId, startDate, endDate, prevStart.toISOString().slice(0, 10), prevEnd.toISOString().slice(0, 10), res);
  }
}

function getSummaryWithDates(userId, startDate, endDate, prevStartDate, prevEndDate, res) {
  console.log(`Current period: ${startDate} to ${endDate}, Previous period: ${prevStartDate} to ${prevEndDate}`);
  
  const currentPeriodQuery = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
      COUNT(*) as transactionCount
    FROM financial_records
    WHERE created_by = ? AND date >= ? AND date <= ?
  `;
  
  const previousPeriodQuery = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
    FROM financial_records
    WHERE created_by = ? AND date >= ? AND date <= ?
  `;
  
  db.get(currentPeriodQuery, [userId, startDate, endDate], (err, current) => {
    if (err) {
      console.error('Error in current period query:', err);
      return res.status(500).json({ error: 'Failed to calculate current period summary' });
    }
    
    console.log('Current period raw data:', current);
    
    db.get(previousPeriodQuery, [userId, prevStartDate, prevEndDate], (err, previous) => {
      if (err) {
        console.error('Error in previous period query:', err);
        return res.status(500).json({ error: 'Failed to calculate previous period summary' });
      }
      
      console.log('Previous period raw data:', previous);
      
      const totalIncome = parseFloat(current.totalIncome) || 0;
      const totalExpense = parseFloat(current.totalExpense) || 0;
      const netBalance = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0;
      const transactionCount = parseInt(current.transactionCount) || 0;
      
      const lastPeriodIncome = parseFloat(previous.income) || 0;
      const lastPeriodExpense = parseFloat(previous.expense) || 0;
      
      const incomeChangePercent = lastPeriodIncome > 0 
        ? (((totalIncome - lastPeriodIncome) / lastPeriodIncome) * 100).toFixed(1)
        : 0;
      
      const expenseChangePercent = lastPeriodExpense > 0
        ? (((totalExpense - lastPeriodExpense) / lastPeriodExpense) * 100).toFixed(1)
        : 0;
      
      const result = {
        totalIncome,
        totalExpense,
        netBalance,
        savingsRate: parseFloat(savingsRate),
        transactionCount,
        lastMonthIncome: lastPeriodIncome,
        lastMonthExpense: lastPeriodExpense,
        incomeChangePercent: parseFloat(incomeChangePercent),
        expenseChangePercent: parseFloat(expenseChangePercent)
      };
      
      console.log('Sending summary result:', result);
      res.json(result);
    });
  });
}

// Get category wise totals for logged in user
function getCategoryTotals(req, res) {
  const userId = req.user.id;
  const startDate = req.query.start;
  const endDate = req.query.end;
  
  if (!startDate || !endDate) {
    db.get(`SELECT MAX(date) as maxDate FROM financial_records WHERE created_by = ?`, [userId], (err, dateResult) => {
      if (err) return res.status(500).json({ error: 'Failed to get date range' });
      
      const currentMonth = dateResult?.maxDate?.slice(0, 7) || new Date().toISOString().slice(0, 7);
      getCategoryTotalsWithDates(userId, currentMonth + '-01', dateResult?.maxDate, res);
    });
  } else {
    getCategoryTotalsWithDates(userId, startDate, endDate, res);
  }
}

function getCategoryTotalsWithDates(userId, startDate, endDate, res) {
  const query = `
    SELECT category, type, SUM(amount) as total
    FROM financial_records
    WHERE created_by = ? AND date >= ? AND date <= ?
    GROUP BY category, type
    ORDER BY total DESC
  `;

  db.all(query, [userId, startDate, endDate], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch category totals' });
    }
    res.json({ categoryTotals: results || [] });
  });
}

// Get recent transactions for logged in user
function getRecentTransactions(req, res) {
  const userId = req.user.id;
  const limit = req.query.limit || 8;

  const query = `
    SELECT id, amount, type, category, date, notes
    FROM financial_records 
    WHERE created_by = ? 
    ORDER BY date DESC, created_at DESC 
    LIMIT ?
  `;

  db.all(query, [userId, limit], (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch recent transactions' });
    }
    res.json({ recentTransactions: records || [] });
  });
}

// Get monthly trends for logged in user
function getMonthlyTrends(req, res) {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      strftime('%Y-%m', date) as month,
      type,
      SUM(amount) as total
    FROM financial_records
    WHERE created_by = ?
    GROUP BY month, type
    ORDER BY month ASC
  `;

  db.all(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch monthly trends' });
    }
    res.json({ monthlyTrends: results || [] });
  });
}

// Get daily transaction counts for current month
function getDailyCounts(req, res) {
  const userId = req.user.id;
  
  db.get(`SELECT MAX(date) as maxDate FROM financial_records WHERE created_by = ?`, [userId], (err, dateResult) => {
    if (err) return res.status(500).json({ error: 'Failed to get date range' });
    
    const currentMonth = dateResult?.maxDate?.slice(0, 7) || new Date().toISOString().slice(0, 7);
    
    const query = `
      SELECT 
        date,
        COUNT(*) as count,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM financial_records
      WHERE created_by = ? AND strftime('%Y-%m', date) = ?
      GROUP BY date
      ORDER BY date ASC
    `;

    db.all(query, [userId, currentMonth], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch daily counts' });
      }
      res.json({ dailyCounts: results || [] });
    });
  });
}

// Get monthly comparison - current vs previous month
function getMonthlyComparison(req, res) {
  const userId = req.user.id;
  
  db.get(`SELECT MAX(date) as maxDate FROM financial_records WHERE created_by = ?`, [userId], (err, dateResult) => {
    if (err) return res.status(500).json({ error: 'Failed to get date range' });
    
    const maxDate = dateResult?.maxDate || new Date().toISOString().slice(0, 10);
    const currentMonth = maxDate.slice(0, 7);
    const prevDate = new Date(maxDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const previousMonth = prevDate.toISOString().slice(0, 7);
    
    const query = `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM financial_records
      WHERE created_by = ? AND (strftime('%Y-%m', date) = ? OR strftime('%Y-%m', date) = ?)
      GROUP BY month
      ORDER BY month DESC
    `;

    db.all(query, [userId, currentMonth, previousMonth], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch monthly comparison' });
      }
      
      const current = results.find(r => r.month === currentMonth) || { income: 0, expense: 0 };
      const previous = results.find(r => r.month === previousMonth) || { income: 0, expense: 0 };
      
      res.json({
        currentMonth: {
          income: current.income || 0,
          expense: current.expense || 0,
          netBalance: (current.income || 0) - (current.expense || 0)
        },
        previousMonth: {
          income: previous.income || 0,
          expense: previous.expense || 0,
          netBalance: (previous.income || 0) - (previous.expense || 0)
        }
      });
    });
  });
}

// Get weekly summary
function getWeeklySummary(req, res) {
  const userId = req.user.id;
  
  db.get(`SELECT MAX(date) as maxDate FROM financial_records WHERE created_by = ?`, [userId], (err, dateResult) => {
    if (err) return res.status(500).json({ error: 'Failed to get date range' });
    
    const maxDate = dateResult?.maxDate || new Date().toISOString().slice(0, 10);
    
    const query = `
      SELECT 
        date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM financial_records
      WHERE created_by = ? AND date >= date(?, '-7 days') AND date <= ?
      GROUP BY date
      ORDER BY date ASC
    `;

    db.all(query, [userId, maxDate, maxDate], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch weekly summary' });
      }
      res.json({ weeklySummary: results || [] });
    });
  });
}

// Get streak - consecutive days with transactions
function getStreak(req, res) {
  const userId = req.user.id;
  
  const query = `
    SELECT DISTINCT date
    FROM financial_records
    WHERE created_by = ?
    ORDER BY date DESC
  `;

  db.all(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch streak' });
    }
    
    if (results.length === 0) {
      return res.json({ streak: 0 });
    }
    
    let streak = 0;
    let currentDate = new Date(results[0].date);
    
    for (let i = 0; i < results.length; i++) {
      const recordDate = results[i].date;
      const expectedDate = currentDate.toISOString().slice(0, 10);
      
      if (recordDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    res.json({ streak });
  });
}

// Get daily cashflow for current month
function getDailyCashflow(req, res) {
  const userId = req.user.id;
  
  db.get(`SELECT MAX(date) as maxDate FROM financial_records WHERE created_by = ?`, [userId], (err, dateResult) => {
    if (err) return res.status(500).json({ error: 'Failed to get date range' });
    
    const month = req.query.month || dateResult?.maxDate?.slice(0, 7) || new Date().toISOString().slice(0, 7);
    
    const query = `
      SELECT 
        date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM financial_records
      WHERE created_by = ? AND strftime('%Y-%m', date) = ?
      GROUP BY date
      ORDER BY date ASC
    `;

    db.all(query, [userId, month], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch daily cashflow' });
      }
      res.json({ dailyCashflow: results || [] });
    });
  });
}

// Get recent activity for activity feed
function getRecentActivity(req, res) {
  const userId = req.user.id;
  const limit = req.query.limit || 10;
  
  const query = `
    SELECT 
      id,
      category,
      type,
      amount,
      date,
      created_at
    FROM financial_records
    WHERE created_by = ?
    ORDER BY created_at DESC
    LIMIT ?
  `;

  db.all(query, [userId, limit], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
    
    const activities = results.map(record => {
      const action = 'added';
      const description = `New record ${action} - ${record.category} Rs ${record.amount.toLocaleString('en-IN')}`;
      const timeAgo = getTimeAgo(new Date(record.created_at));
      
      return {
        type: record.type === 'income' ? 'success' : 'info',
        description: description,
        time: timeAgo
      };
    });
    
    res.json({ recentActivity: activities });
  });
}

// Get top transactions by amount for current month
function getTopTransactions(req, res) {
  const userId = req.user.id;
  const limit = req.query.limit || 10;
  
  db.get(`SELECT MAX(date) as maxDate FROM financial_records WHERE created_by = ?`, [userId], (err, dateResult) => {
    if (err) return res.status(500).json({ error: 'Failed to get date range' });
    
    const currentMonth = dateResult?.maxDate?.slice(0, 7) || new Date().toISOString().slice(0, 7);
    
    const query = `
      SELECT id, amount, type, category, date, notes
      FROM financial_records
      WHERE created_by = ? AND strftime('%Y-%m', date) = ?
      ORDER BY amount DESC
      LIMIT ?
    `;
    
    db.all(query, [userId, currentMonth, limit], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch top transactions' });
      }
      res.json({ topTransactions: results || [] });
    });
  });
}

// Get payment obligations
function getPaymentObligations(req, res) {
  const userId = req.user.id;
  
  const query = `
    SELECT category, amount, date, notes
    FROM financial_records
    WHERE created_by = ? 
      AND type = 'expense'
      AND category IN ('Credit Card', 'Rent', 'EMI', 'Utilities')
      AND date >= date('now', '-30 days')
    ORDER BY date DESC
  `;
  
  db.all(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch payment obligations' });
    }
    
    const obligations = {};
    results.forEach(record => {
      if (!obligations[record.category]) {
        obligations[record.category] = record;
      }
    });
    
    res.json({ paymentObligations: Object.values(obligations) });
  });
}

// Get transaction frequency for heatmap
function getTransactionFrequency(req, res) {
  const userId = req.user.id;
  
  db.get(`SELECT MAX(date) as maxDate FROM financial_records WHERE created_by = ?`, [userId], (err, dateResult) => {
    if (err) return res.status(500).json({ error: 'Failed to get date range' });
    
    const currentMonth = dateResult?.maxDate?.slice(0, 7) || new Date().toISOString().slice(0, 7);
    
    const query = `
      SELECT date, COUNT(*) as count
      FROM financial_records
      WHERE created_by = ? AND strftime('%Y-%m', date) = ?
      GROUP BY date
      ORDER BY date ASC
    `;
    
    db.all(query, [userId, currentMonth], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch transaction frequency' });
      }
      res.json({ transactionFrequency: results || [] });
    });
  });
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Get daily net balance for ECG chart
function getDailyNet(req, res) {
  const userId = req.user.id;
  const startDate = req.query.start;
  const endDate = req.query.end;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }
  
  const query = `
    SELECT 
      date,
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
    FROM financial_records
    WHERE created_by = ? AND date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date ASC
  `;
  
  db.all(query, [userId, startDate, endDate], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch daily net' });
    }
    res.json({ dailyNet: results || [] });
  });
}

// Get spending distribution for histogram
function getSpendingDistribution(req, res) {
  const userId = req.user.id;
  const startDate = req.query.start;
  const endDate = req.query.end;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }
  
  const query = `
    SELECT amount
    FROM financial_records
    WHERE created_by = ? AND type = 'expense' AND date >= ? AND date <= ?
    ORDER BY amount ASC
  `;
  
  db.all(query, [userId, startDate, endDate], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch spending distribution' });
    }
    
    // Group into buckets
    const buckets = {
      '0-500': 0,
      '500-1000': 0,
      '1000-2000': 0,
      '2000-5000': 0,
      '5000+': 0
    };
    
    results.forEach(record => {
      const amount = record.amount;
      if (amount < 500) buckets['0-500']++;
      else if (amount < 1000) buckets['500-1000']++;
      else if (amount < 2000) buckets['1000-2000']++;
      else if (amount < 5000) buckets['2000-5000']++;
      else buckets['5000+']++;
    });
    
    res.json({ distribution: buckets });
  });
}

// Get all transactions for scatter plot
function getAllTransactions(req, res) {
  const userId = req.user.id;
  const startDate = req.query.start;
  const endDate = req.query.end;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }
  
  const query = `
    SELECT category, amount, type
    FROM financial_records
    WHERE created_by = ? AND date >= ? AND date <= ?
    ORDER BY date DESC
    LIMIT 200
  `;
  
  db.all(query, [userId, startDate, endDate], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
    res.json({ transactions: results || [] });
  });
}

// Get category month matrix for heatmap
function getCategoryMonthMatrix(req, res) {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      category,
      strftime('%Y-%m', date) as month,
      SUM(amount) as total
    FROM financial_records
    WHERE created_by = ?
    GROUP BY category, month
    ORDER BY month ASC, category ASC
  `;
  
  db.all(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch category month matrix' });
    }
    res.json({ matrix: results || [] });
  });
}

// Get cumulative savings
function getCumulativeSavings(req, res) {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net
    FROM financial_records
    WHERE created_by = ?
    GROUP BY month
    ORDER BY month ASC
  `;
  
  db.all(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch cumulative savings' });
    }
    
    // Calculate cumulative
    let cumulative = 0;
    const cumulativeData = results.map(row => {
      cumulative += row.net;
      return {
        month: row.month,
        cumulative: cumulative
      };
    });
    
    res.json({ cumulativeSavings: cumulativeData });
  });
}

// Get monthly expense change
function getMonthlyExpenseChange(req, res) {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(amount) as total
    FROM financial_records
    WHERE created_by = ? AND type = 'expense'
    GROUP BY month
    ORDER BY month ASC
  `;
  
  db.all(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch monthly expense change' });
    }
    
    // Calculate percentage change
    const changes = [];
    for (let i = 1; i < results.length; i++) {
      const current = results[i].total;
      const previous = results[i - 1].total;
      const change = previous > 0 ? ((current - previous) / previous * 100) : 0;
      changes.push({
        month: results[i].month,
        change: change
      });
    }
    
    res.json({ expenseChanges: changes });
  });
}

// Get savings rate trend
function getSavingsRateTrend(req, res) {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM financial_records
    WHERE created_by = ?
    GROUP BY month
    ORDER BY month ASC
  `;
  
  db.all(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch savings rate trend' });
    }
    
    const savingsRates = results.map(row => {
      const savingsRate = row.income > 0 ? ((row.income - row.expense) / row.income * 100) : 0;
      return {
        month: row.month,
        savingsRate: savingsRate
      };
    });
    
    res.json({ savingsRates: savingsRates });
  });
}

// Get money flow for network diagram
function getMoneyFlow(req, res) {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      category,
      type,
      SUM(amount) as total
    FROM financial_records
    WHERE created_by = ?
    GROUP BY category, type
    ORDER BY total DESC
  `;
  
  db.all(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch money flow' });
    }
    
    const income = results.filter(r => r.type === 'income');
    const expense = results.filter(r => r.type === 'expense');
    
    res.json({ 
      income: income,
      expense: expense
    });
  });
}

module.exports = { 
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
};
