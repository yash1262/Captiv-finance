import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import './Analytics.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('This Month');
  const [dateRange, setDateRange] = useState({ start: '2026-04-01', end: '2026-04-30' });
  const [data, setData] = useState({
    summary: {},
    monthlyBreakdown: [],
    categoryTotals: [],
    records: []
  });

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const range = getDateRangeForPeriod(period);
    setDateRange(range);
    loadAnalyticsData(range.start, range.end);
  }, [period]);

  const getDateRangeForPeriod = (periodName) => {
    if (periodName === 'This Month') return { start: '2026-04-01', end: '2026-04-30' };
    if (periodName === 'Last Month') return { start: '2026-03-01', end: '2026-03-31' };
    if (periodName === 'Last 3 Months') return { start: '2026-02-01', end: '2026-04-30' };
    if (periodName === 'Last 6 Months') return { start: '2025-11-01', end: '2026-04-30' };
    if (periodName === 'This Year') return { start: '2026-01-01', end: '2026-12-31' };
    if (periodName === 'All Time') return { start: '2025-10-01', end: '2026-04-30' };
    return { start: '2026-04-01', end: '2026-04-30' };
  };

  const loadAnalyticsData = async (start, end) => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const params = new URLSearchParams({ start, end });

      const [summary, records, categories] = await Promise.all([
        fetch(`/api/dashboard/summary?${params}`, { headers }).then(r => r.json()),
        fetch(`/api/records?startDate=${start}&endDate=${end}`, { headers }).then(r => r.json()),
        fetch(`/api/dashboard/category-totals?${params}`, { headers }).then(r => r.json())
      ]);

      const monthlyBreakdown = calculateMonthlyBreakdown(records.records || []);

      setData({
        summary,
        monthlyBreakdown,
        categoryTotals: categories.categoryTotals || [],
        records: records.records || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyBreakdown = (records) => {
    const monthMap = {};
    
    records.forEach(record => {
      const month = record.date.slice(0, 7);
      if (!monthMap[month]) {
        monthMap[month] = {
          month,
          income: 0,
          expense: 0,
          count: 0
        };
      }
      
      if (record.type === 'income') {
        monthMap[month].income += record.amount;
      } else {
        monthMap[month].expense += record.amount;
      }
      monthMap[month].count++;
    });

    return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₹', 'Rs ');
  };

  const incomeVsExpenseData = {
    labels: data.monthlyBreakdown.map(m => {
      const date = new Date(m.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Income',
        data: data.monthlyBreakdown.map(m => m.income),
        borderColor: '#00DF81',
        backgroundColor: 'rgba(0, 223, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4
      },
      {
        label: 'Expense',
        data: data.monthlyBreakdown.map(m => m.expense),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };

  const categoryData = {
    labels: data.categoryTotals.filter(c => c.type === 'expense').slice(0, 6).map(c => c.category),
    datasets: [{
      data: data.categoryTotals.filter(c => c.type === 'expense').slice(0, 6).map(c => c.total),
      backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'],
      borderWidth: 0
    }]
  };

  const avgTransaction = data.records.length > 0
    ? data.records.reduce((sum, r) => sum + r.amount, 0) / data.records.length
    : 0;

  if (loading) {
    return <div className="analytics-page"><div className="loading-state">Loading analytics...</div></div>;
  }

  return (
    <div className="analytics-page">
      <div className="page-header-analytics">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Detailed financial insights and trends</p>
        </div>
        <select
          className="period-selector"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option>This Month</option>
          <option>Last Month</option>
          <option>Last 3 Months</option>
          <option>Last 6 Months</option>
          <option>This Year</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="metrics-row">
        <div className="metric-card" style={{ borderLeftColor: '#00DF81' }}>
          <div className="metric-label">TOTAL INCOME</div>
          <div className="metric-value">{formatCurrency(data.summary.totalIncome || 0)}</div>
          <div className="metric-change">
            {data.summary.incomeChangePercent >= 0 ? '+' : ''}{data.summary.incomeChangePercent}% vs previous
          </div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#EF4444' }}>
          <div className="metric-label">TOTAL EXPENSES</div>
          <div className="metric-value">{formatCurrency(data.summary.totalExpense || 0)}</div>
          <div className="metric-change">
            {data.summary.expenseChangePercent >= 0 ? '+' : ''}{data.summary.expenseChangePercent}% vs previous
          </div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: data.summary.netBalance >= 0 ? '#00DF81' : '#EF4444' }}>
          <div className="metric-label">NET SAVINGS</div>
          <div className="metric-value">{formatCurrency(data.summary.netBalance || 0)}</div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#3B82F6' }}>
          <div className="metric-label">SAVINGS RATE</div>
          <div className="metric-value">{data.summary.savingsRate || 0}%</div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#8B5CF6' }}>
          <div className="metric-label">TOTAL TRANSACTIONS</div>
          <div className="metric-value">{data.summary.transactionCount || 0}</div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#F59E0B' }}>
          <div className="metric-label">AVG TRANSACTION</div>
          <div className="metric-value">{formatCurrency(avgTransaction)}</div>
        </div>
      </div>

      <div className="charts-row-2">
        <div className="chart-card chart-card-large">
          <h3 className="chart-title">Income vs Expense Over Time</h3>
          <div className="chart-wrapper">
            <Line
              data={incomeVsExpenseData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', align: 'end' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Spending by Category</h3>
          <div className="chart-wrapper">
            <Pie
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="monthly-table-card">
        <h3 className="chart-title">Monthly Summary</h3>
        <table className="monthly-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="text-right">Total Income</th>
              <th className="text-right">Total Expenses</th>
              <th className="text-right">Net Balance</th>
              <th className="text-right">Savings Rate</th>
              <th className="text-right">Transactions</th>
            </tr>
          </thead>
          <tbody>
            {data.monthlyBreakdown.map((month, index) => {
              const netBalance = month.income - month.expense;
              const savingsRate = month.income > 0 ? ((netBalance / month.income) * 100).toFixed(1) : 0;
              
              return (
                <tr key={index}>
                  <td>
                    {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="text-right income-color">{formatCurrency(month.income)}</td>
                  <td className="text-right expense-color">{formatCurrency(month.expense)}</td>
                  <td className={`text-right ${netBalance >= 0 ? 'income-color' : 'expense-color'}`}>
                    {formatCurrency(netBalance)}
                  </td>
                  <td className="text-right">
                    <span className={`savings-badge ${savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'medium' : 'low'}`}>
                      {savingsRate}%
                    </span>
                  </td>
                  <td className="text-right">{month.count}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td>Total</td>
              <td className="text-right">{formatCurrency(data.monthlyBreakdown.reduce((sum, m) => sum + m.income, 0))}</td>
              <td className="text-right">{formatCurrency(data.monthlyBreakdown.reduce((sum, m) => sum + m.expense, 0))}</td>
              <td className="text-right">
                {formatCurrency(data.monthlyBreakdown.reduce((sum, m) => sum + (m.income - m.expense), 0))}
              </td>
              <td className="text-right">-</td>
              <td className="text-right">{data.monthlyBreakdown.reduce((sum, m) => sum + m.count, 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default Analytics;
