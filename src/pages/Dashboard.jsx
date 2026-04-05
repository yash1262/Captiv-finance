import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('This Month');
  const [dateRange, setDateRange] = useState({ start: '2026-04-01', end: '2026-04-30' });
  const [dashboardData, setDashboardData] = useState({
    summary: { totalIncome: 0, totalExpense: 0, netBalance: 0 },
    transactions: [],
    categoryTotals: [],
    monthlyTrends: [],
    dailyCounts: [],
    weeklySummary: [],
    monthlyComparison: { currentMonth: {}, previousMonth: {} },
    streak: 0,
    dailyCashflow: [],
    recentActivity: [],
    topTransactions: [],
    paymentObligations: [],
    transactionFrequency: []
  });
  const [analyticsData, setAnalyticsData] = useState({
    dailyNet: [],
    spendingDistribution: {},
    allTransactions: [],
    categoryMonthMatrix: [],
    cumulativeSavings: [],
    expenseChanges: [],
    savingsRates: [],
    moneyFlow: { income: [], expense: [] }
  });

  const token = localStorage.getItem('authToken');

  const getDateRangeForFilter = (filterName) => {
    const referenceDate = new Date('2026-04-05');
    
    if (filterName === 'This Week') {
      const dayOfWeek = referenceDate.getDay();
      const monday = new Date(referenceDate);
      monday.setDate(referenceDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().slice(0, 10),
        end: sunday.toISOString().slice(0, 10)
      };
    }
    
    if (filterName === 'This Month') {
      return { start: '2026-04-01', end: '2026-04-30' };
    }
    
    if (filterName === 'Last Month') {
      return { start: '2026-03-01', end: '2026-03-31' };
    }
    
    if (filterName === 'Last 3 Months') {
      return { start: '2026-02-01', end: '2026-04-30' };
    }
    
    if (filterName === 'This Year') {
      return { start: '2026-01-01', end: '2026-12-31' };
    }
    
    return { start: '2026-04-01', end: '2026-04-30' };
  };

  const handleFilterChange = (filterName) => {
    setActiveFilter(filterName);
    const newDateRange = getDateRangeForFilter(filterName);
    setDateRange(newDateRange);
    loadDashboardData(newDateRange.start, newDateRange.end);
  };

  useEffect(() => {
    const initialRange = getDateRangeForFilter('This Month');
    setDateRange(initialRange);
    loadDashboardData(initialRange.start, initialRange.end);
  }, []);

  const fetchWithTimeout = async (url, options, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${url}`);
        throw new Error('Request timeout');
      }
      throw error;
    }
  };

  const loadDashboardData = async (startDate, endDate) => {
    setLoading(true);
    console.log('Dashboard: Starting to load data for', startDate, 'to', endDate);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const params = new URLSearchParams({ start: startDate, end: endDate });
      console.log('Dashboard: Token exists:', !!token);
      
      const [summary, transactions, categories, trends, dailyCounts, weekly, comparison, streak, cashflow, activity, topTxns, obligations, frequency] = await Promise.allSettled([
        fetchWithTimeout(`/api/dashboard/summary?${params}`, { headers }),
        fetchWithTimeout(`/api/records?startDate=${startDate}&endDate=${endDate}&limit=100`, { headers }),
        fetchWithTimeout(`/api/dashboard/category-totals?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/monthly-trends?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/daily-counts?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/weekly-summary?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/monthly-comparison?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/streak?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/daily-cashflow?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/recent-activity?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/top-transactions?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/payment-obligations?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/transaction-frequency?${params}`, { headers })
      ]).then(results => results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`API call ${index} failed:`, result.reason);
          return null;
        }
      }));

      console.log('Dashboard: Summary data received:', summary);
      console.log('Dashboard: Transactions count:', transactions?.records?.length || 0);

      const newData = {
        summary: summary || { totalIncome: 0, totalExpense: 0, netBalance: 0 },
        transactions: transactions?.records || [],
        categoryTotals: categories?.categoryTotals || [],
        monthlyTrends: trends?.monthlyTrends || [],
        dailyCounts: dailyCounts?.dailyCounts || [],
        weeklySummary: weekly?.weeklySummary || [],
        monthlyComparison: comparison || { currentMonth: {}, previousMonth: {} },
        streak: streak?.streak || 0,
        dailyCashflow: cashflow?.dailyCashflow || [],
        recentActivity: activity?.recentActivity || [],
        topTransactions: topTxns?.topTransactions || [],
        paymentObligations: obligations?.paymentObligations || [],
        transactionFrequency: frequency?.transactionFrequency || []
      };

      console.log('Dashboard: Setting dashboard data:', newData.summary);
      setDashboardData(newData);
      
      // Load advanced analytics data
      loadAnalyticsData(startDate, endDate, headers);
      
      setError(null);
    } catch (error) {
      console.error('Dashboard: Error loading data:', error);
      setError('Failed to load dashboard data. Please check if the server is running.');
    } finally {
      setLoading(false);
      console.log('Dashboard: Loading complete');
    }
  };

  const loadAnalyticsData = async (startDate, endDate, headers) => {
    try {
      const params = new URLSearchParams({ start: startDate, end: endDate });
      
      const [dailyNet, distribution, allTxns, matrix, cumulative, expenseChange, savingsRate, moneyFlow] = await Promise.allSettled([
        fetchWithTimeout(`/api/dashboard/daily-net?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/spending-distribution?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/all-transactions?${params}`, { headers }),
        fetchWithTimeout(`/api/dashboard/category-month-matrix`, { headers }),
        fetchWithTimeout(`/api/dashboard/cumulative-savings`, { headers }),
        fetchWithTimeout(`/api/dashboard/monthly-expense-change`, { headers }),
        fetchWithTimeout(`/api/dashboard/savings-rate-trend`, { headers }),
        fetchWithTimeout(`/api/dashboard/money-flow`, { headers })
      ]).then(results => results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Analytics API call ${index} failed:`, result.reason);
          return null;
        }
      }));
      
      setAnalyticsData({
        dailyNet: dailyNet?.dailyNet || [],
        spendingDistribution: distribution?.distribution || {},
        allTransactions: allTxns?.transactions || [],
        categoryMonthMatrix: matrix?.matrix || [],
        cumulativeSavings: cumulative?.cumulativeSavings || [],
        expenseChanges: expenseChange?.expenseChanges || [],
        savingsRates: savingsRate?.savingsRates || [],
        moneyFlow: moneyFlow || { income: [], expense: [] }
      });
    } catch (error) {
      console.error('Analytics: Error loading data:', error);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === 0) return 'Rs 0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₹', 'Rs ');
  };

  const formatCurrencyShort = (amount) => {
    if (amount === 0) return 'Rs 0';
    if (Math.abs(amount) >= 1000) {
      return 'Rs ' + (amount / 1000).toFixed(0) + 'K';
    }
    return 'Rs ' + amount.toFixed(0);
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const incomeChange = calculatePercentageChange(
    dashboardData.monthlyComparison.currentMonth.income || 0,
    dashboardData.monthlyComparison.previousMonth.income || 0
  );
  
  const expenseChange = calculatePercentageChange(
    dashboardData.monthlyComparison.currentMonth.expense || 0,
    dashboardData.monthlyComparison.previousMonth.expense || 0
  );

  // Prepare chart data
  const chartColors = [
    '#10B981', // Salary - green
    '#EF4444', // Rent - red
    '#F59E0B', // Food - orange
    '#3B82F6', // Transport - blue
    '#8B5CF6', // Health - purple
    '#EC4899', // Entertainment - pink
    '#F97316', // Shopping - orange
    '#DC2626', // Credit Card - red
    '#7C3AED', // EMI - purple
    '#06B6D4', // Utilities - cyan
    '#0EA5E9', // Education - blue
    '#F43F5E', // Gifts - pink
    '#14B8A6', // Freelance - teal
    '#84CC16', // Bonus - lime
    '#A78BFA', // Interest - purple
    '#34D399', // Rental - green
    '#FB7185'  // Personal Care - pink
  ];

  // Category color map
  const categoryColorMap = {
    'Salary': '#10B981',
    'Rent': '#EF4444',
    'Food': '#F59E0B',
    'Transport': '#3B82F6',
    'Health': '#8B5CF6',
    'Entertainment': '#EC4899',
    'Shopping': '#F97316',
    'Credit Card': '#DC2626',
    'EMI': '#7C3AED',
    'Utilities': '#06B6D4',
    'Education': '#0EA5E9',
    'Gifts': '#F43F5E',
    'Freelance': '#14B8A6',
    'Bonus': '#84CC16',
    'Interest': '#A78BFA',
    'Rental': '#34D399',
    'Personal Care': '#FB7185'
  };

  const getCategoryColor = (category) => {
    return categoryColorMap[category] || '#9CA3AF';
  };

  // Income vs Expense Trend Chart Data
  const monthlyChartData = () => {
    const monthMap = {};
    dashboardData.monthlyTrends.forEach(trend => {
      if (!monthMap[trend.month]) {
        monthMap[trend.month] = { month: trend.month, income: 0, expense: 0 };
      }
      if (trend.type === 'income') {
        monthMap[trend.month].income = trend.total;
      } else {
        monthMap[trend.month].expense = trend.total;
      }
    });
    
    const sorted = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    const labels = sorted.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'short' });
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: sorted.map(item => item.income),
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6',
          borderWidth: 2
        },
        {
          label: 'Expense',
          data: sorted.map(item => item.expense),
          backgroundColor: '#F59E0B',
          borderColor: '#F59E0B',
          borderWidth: 2
        }
      ]
    };
  };

  // Category Breakdown Donut Chart Data
  const categoryDonutData = () => {
    const expenseCategories = dashboardData.categoryTotals.filter(cat => cat.type === 'expense').slice(0, 6);
    const totalExpense = expenseCategories.reduce((sum, cat) => sum + cat.total, 0);
    
    return {
      labels: expenseCategories.map(cat => cat.category),
      datasets: [{
        data: expenseCategories.map(cat => cat.total),
        backgroundColor: chartColors,
        borderWidth: 0
      }]
    };
  };

  // Top 5 Transactions Chart Data
  const top10TransactionsData = () => {
    const topTxns = (dashboardData.topTransactions || []).slice(0, 5);
    
    return {
      labels: topTxns.map(txn => {
        const label = txn.notes || txn.category;
        return label.length > 20 ? label.substring(0, 20) + '...' : label;
      }),
      datasets: [{
        label: 'Amount',
        data: topTxns.map(txn => txn.amount),
        backgroundColor: topTxns.map(txn => txn.type === 'income' ? '#8B5CF6' : '#EC4899'),
        borderWidth: 0
      }]
    };
  };

  // Monthly Performance Chart Data
  const monthlyPerformanceData = () => {
    const current = dashboardData.monthlyComparison.currentMonth;
    const previous = dashboardData.monthlyComparison.previousMonth;
    
    return {
      labels: ['Income', 'Expenses', 'Net Balance'],
      datasets: [
        {
          label: 'This Month',
          data: [current.income || 0, current.expense || 0, current.netBalance || 0],
          backgroundColor: '#14B8A6',
          borderWidth: 0
        },
        {
          label: 'Last Month',
          data: [previous.income || 0, previous.expense || 0, previous.netBalance || 0],
          backgroundColor: '#06B6D4',
          borderWidth: 0
        }
      ]
    };
  };

  // Expense by Category Chart Data
  const expenseByCategoryData = () => {
    const expenseCategories = dashboardData.categoryTotals
      .filter(cat => cat.type === 'expense')
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
    
    return {
      labels: expenseCategories.map(cat => {
        return cat.category.length > 10 ? cat.category.substring(0, 10) + '...' : cat.category;
      }),
      datasets: [{
        label: 'Amount',
        data: expenseCategories.map(cat => cat.total),
        backgroundColor: chartColors,
        borderWidth: 0
      }]
    };
  };

  // Cash Flow Balance Donut Data
  const cashFlowBalanceData = () => {
    return {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [dashboardData.summary.totalIncome, dashboardData.summary.totalExpense],
        backgroundColor: ['#10B981', '#F97316'],
        borderWidth: 0
      }]
    };
  };

  // Daily Cash Flow Chart Data
  const dailyCashFlowData = () => {
    const sorted = [...dashboardData.dailyCashflow].sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      labels: sorted.map(day => {
        const date = new Date(day.date);
        return date.getDate();
      }),
      datasets: [
        {
          label: 'Income',
          data: sorted.map(day => day.income),
          borderColor: '#0EA5E9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Expense',
          data: sorted.map(day => day.expense),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 6,
          font: { size: 9, family: 'Inter' }
        }
      },
      tooltip: {
        backgroundColor: '#032221',
        titleFont: { size: 10, family: 'Inter' },
        bodyFont: { size: 9, family: 'Inter' },
        padding: 8,
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 8, family: 'Inter' },
          maxRotation: 0,
          maxTicksLimit: 6
        }
      },
      y: {
        grid: { color: '#E5E7EB' },
        ticks: { 
          font: { size: 8, family: 'Inter' },
          maxTicksLimit: 3
        }
      }
    },
    layout: {
      padding: 2
    },
    barThickness: 8
  };

  const horizontalChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#032221',
        titleFont: { size: 10, family: 'Inter' },
        bodyFont: { size: 9, family: 'Inter' },
        padding: 8,
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 8, family: 'Inter' },
          maxTicksLimit: 3
        }
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 8, family: 'Inter' } }
      }
    },
    layout: {
      padding: 2
    },
    barThickness: 8
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#032221',
        titleFont: { size: 10, family: 'Inter' },
        bodyFont: { size: 9, family: 'Inter' },
        padding: 8,
        cornerRadius: 6
      }
    },
    cutout: '68%',
    layout: {
      padding: 4
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 6,
          font: { size: 9, family: 'Inter' }
        }
      },
      tooltip: {
        backgroundColor: '#032221',
        titleFont: { size: 10, family: 'Inter' },
        bodyFont: { size: 9, family: 'Inter' },
        padding: 8,
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 8, family: 'Inter' },
          maxRotation: 0,
          maxTicksLimit: 10
        }
      },
      y: {
        grid: { color: '#E5E7EB' },
        ticks: { 
          font: { size: 8, family: 'Inter' },
          maxTicksLimit: 3
        }
      }
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 3
      },
      line: {
        borderWidth: 1.5,
        tension: 0.4
      }
    },
    layout: {
      padding: 2
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-powerbi">
        <div className="loading-spinner-powerbi"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-loading-powerbi">
        <div style={{ color: '#EF4444', fontSize: '16px', marginBottom: '20px' }}>⚠️ {error}</div>
        <button 
          onClick={loadDashboardData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#00DF81',
            color: '#032221',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Retry
        </button>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Make sure the backend server is running on port 3000
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-powerbi">
      {/* Filter Chips Bar */}
      <div className="filter-chips-bar">
        {['This Week', 'This Month', 'Last Month', 'Last 3 Months', 'This Year'].map(filter => (
          <button
            key={filter}
            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => handleFilterChange(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Row 1 - Income vs Expense Trend, Category Breakdown, Quick Stats */}
      <div className="dashboard-row-1">
        <div className="powerbi-card card-40">
          <h3 className="card-title-powerbi">Income vs Expense Trend</h3>
          <div className="chart-container-220">
            <Bar data={monthlyChartData()} options={chartOptions} />
          </div>
        </div>

        <div className="powerbi-card card-30">
          <h3 className="card-title-powerbi">Category Breakdown</h3>
          <div className="chart-container-220">
            <Doughnut data={categoryDonutData()} options={donutOptions} />
            <div className="donut-center-text">
              <div className="donut-center-label">Total</div>
              <div className="donut-center-value">{formatCurrencyShort(dashboardData.summary.totalExpense)}</div>
            </div>
          </div>
        </div>

        <div className="powerbi-card card-30">
          <h3 className="card-title-powerbi">Quick Stats</h3>
          <div className="quick-stats-list">
            <div className="quick-stat-row">
              <div className="stat-dot" style={{ backgroundColor: '#DC2626' }}></div>
              <div className="stat-info">
                <div className="stat-label-small">Highest Expense</div>
                <div className="stat-value-small">
                  {dashboardData.transactions.filter(t => t.type === 'expense').length > 0
                    ? formatCurrency(Math.max(...dashboardData.transactions.filter(t => t.type === 'expense').map(t => t.amount)))
                    : 'Rs 0.00'}
                </div>
              </div>
            </div>
            <div className="quick-stat-row">
              <div className="stat-dot" style={{ backgroundColor: '#3B82F6' }}></div>
              <div className="stat-info">
                <div className="stat-label-small">Peak Spending Day</div>
                <div className="stat-value-small">
                  {dashboardData.dailyCounts.length > 0
                    ? new Date(dashboardData.dailyCounts.sort((a, b) => b.expense - a.expense)[0].date).getDate()
                    : '-'}
                </div>
              </div>
            </div>
            <div className="quick-stat-row">
              <div className="stat-dot" style={{ backgroundColor: '#8B5CF6' }}></div>
              <div className="stat-info">
                <div className="stat-label-small">Most Active Category</div>
                <div className="stat-value-small">
                  {dashboardData.categoryTotals.length > 0 ? dashboardData.categoryTotals[0].category : 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 - Top 10 Transactions, Monthly Performance */}
      <div className="dashboard-row-2">
        <div className="powerbi-card card-60">
          <h3 className="card-title-powerbi">Top 10 Transactions this Month</h3>
          <div className="chart-container-240">
            <Bar data={top10TransactionsData()} options={horizontalChartOptions} />
          </div>
        </div>

        <div className="powerbi-card card-40">
          <h3 className="card-title-powerbi">Monthly Performance</h3>
          <div className="chart-container-240">
            <Bar data={monthlyPerformanceData()} options={chartOptions} />
          </div>
          <div className="performance-badges">
            <div className="perf-badge">
              <span className="perf-label">Income Change</span>
              <span className={`perf-value ${incomeChange >= 0 ? 'positive' : 'negative'}`}>
                {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(incomeChange)}%
              </span>
            </div>
            <div className="perf-badge">
              <span className="perf-label">Expense Change</span>
              <span className={`perf-value ${expenseChange <= 0 ? 'positive' : 'negative'}`}>
                {expenseChange >= 0 ? '↑' : '↓'} {Math.abs(expenseChange)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 - Expense by Category, Cash Flow Balance, Payment Obligations */}
      <div className="dashboard-row-3">
        <div className="powerbi-card card-33">
          <h3 className="card-title-powerbi">Expense by Category</h3>
          <div className="chart-container-200">
            <Bar data={expenseByCategoryData()} options={horizontalChartOptions} />
          </div>
        </div>

        <div className="powerbi-card card-33">
          <h3 className="card-title-powerbi">Cash Flow Balance</h3>
          <div className="chart-container-200">
            <Doughnut data={cashFlowBalanceData()} options={donutOptions} />
            <div className="donut-center-text">
              <div className="donut-center-label">Net</div>
              <div className={`donut-center-value ${dashboardData.summary.netBalance >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrencyShort(dashboardData.summary.netBalance)}
              </div>
            </div>
          </div>
          <div className="cashflow-legend">
            <div className="legend-row">
              <div className="legend-dot" style={{ backgroundColor: '#10B981' }}></div>
              <span className="legend-text">Income</span>
              <span className="legend-amount income">{formatCurrency(dashboardData.summary.totalIncome)}</span>
            </div>
            <div className="legend-row">
              <div className="legend-dot" style={{ backgroundColor: '#F97316' }}></div>
              <span className="legend-text">Expense</span>
              <span className="legend-amount expense">{formatCurrency(dashboardData.summary.totalExpense)}</span>
            </div>
          </div>
        </div>

        <div className="powerbi-card card-33">
          <h3 className="card-title-powerbi">Payment Obligations</h3>
          <div className="payment-obligations-list">
            {dashboardData.paymentObligations && dashboardData.paymentObligations.length > 0 ? (
              dashboardData.paymentObligations.slice(0, 3).map((obligation, index) => (
                <div key={index} className="obligation-row">
                  <div className="obligation-left">
                    <div className="obligation-dot" style={{ backgroundColor: chartColors[index % chartColors.length] }}></div>
                    <div className="obligation-info">
                      <div className="obligation-name">{obligation.category}</div>
                      <div className="obligation-amount">{formatCurrency(obligation.amount)}</div>
                    </div>
                  </div>
                  <div className="obligation-status paid">Paid</div>
                </div>
              ))
            ) : (
              <div className="no-data-message">No payment obligations found</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4 - Daily Cash Flow, This Week at a Glance */}
      <div className="dashboard-row-4">
        <div className="powerbi-card card-65">
          <h3 className="card-title-powerbi">Daily Cash Flow This Month</h3>
          <div className="chart-container-200">
            <Line data={dailyCashFlowData()} options={lineChartOptions} />
          </div>
        </div>

        <div className="powerbi-card card-35">
          <h3 className="card-title-powerbi">This Week at a Glance</h3>
          <div className="week-glance-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const dayData = dashboardData.weeklySummary[index] || { income: 0, expense: 0 };
              const net = dayData.income - dayData.expense;
              const boxClass = net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral';
              const today = new Date();
              const dayDate = new Date(today);
              dayDate.setDate(today.getDate() - today.getDay() + index + 1);
              
              return (
                <div key={day} className={`week-glance-box ${boxClass}`}>
                  <div className="week-day-name">{day}</div>
                  <div className="week-day-date">{dayDate.getDate()}</div>
                  <div className="week-day-amount">{net !== 0 ? formatCurrency(Math.abs(net)) : '-'}</div>
                </div>
              );
            })}
          </div>
          <div className="streak-counter">
            <span className="streak-text">{dashboardData.streak} day streak</span>
          </div>
        </div>
      </div>

      {/* Row 5 - Transaction Frequency Heatmap, Recent Activity and Insights */}
      <div className="dashboard-row-5">
        <div className="powerbi-card card-50">
          <h3 className="card-title-powerbi">Transaction Frequency</h3>
          <div className="heatmap-container">
            <div className="heatmap-days-header">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="heatmap-day-label">{day}</div>
              ))}
            </div>
            <div className="heatmap-grid">
              {Array.from({ length: 4 }, (_, weekIndex) => (
                <div key={weekIndex} className="heatmap-week">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const i = weekIndex * 7 + dayIndex;
                    const date = new Date('2026-04-01');
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().slice(0, 10);
                    const dayData = dashboardData.transactionFrequency.find(d => d.date === dateStr);
                    const count = dayData ? dayData.count : 0;
                    const intensity = count === 0 ? 'none' : count <= 2 ? 'low' : count <= 4 ? 'medium' : count <= 6 ? 'high' : 'very-high';
                    
                    return (
                      <div
                        key={i}
                        className={`heatmap-cell ${intensity}`}
                        title={`${dateStr}: ${count} transactions`}
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="powerbi-card card-50">
          <h3 className="card-title-powerbi">Recent Activity and Top Insights</h3>
          <div className="activity-insights-container">
            <div className="recent-activity-section">
              <h4 className="subsection-title-powerbi">Recent Transactions</h4>
              <div className="recent-activity-list">
                {dashboardData.transactions.slice(0, 4).map((txn, index) => (
                  <div key={index} className="activity-row">
                    <div className="activity-dot" style={{ backgroundColor: txn.type === 'income' ? '#10B981' : '#F43F5E' }}></div>
                    <div className="activity-details">
                      <div className="activity-category">{txn.category}</div>
                      <div className="activity-date">{new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div className="activity-badge">{txn.type}</div>
                    <div className="activity-amount">{formatCurrency(txn.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="top-insights-section">
              <h4 className="subsection-title-powerbi">Top Insights</h4>
              <div className="insight-card">
                <div className="insight-label">Highest Expense</div>
                <div className="insight-value">
                  {dashboardData.transactions.filter(t => t.type === 'expense').length > 0
                    ? formatCurrency(Math.max(...dashboardData.transactions.filter(t => t.type === 'expense').map(t => t.amount)))
                    : 'Rs 0.00'}
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Peak Day</div>
                <div className="insight-value">
                  {dashboardData.dailyCounts.length > 0
                    ? new Date(dashboardData.dailyCounts.sort((a, b) => (b.income + b.expense) - (a.income + a.expense))[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 6 - EMI Tracker and Utilities Breakdown */}
      <div className="dashboard-row-6">
        <div className="powerbi-card card-50">
          <h3 className="card-title-powerbi">EMI & Loan Tracker</h3>
          <div className="chart-container-200">
            <Bar 
              data={{
                labels: dashboardData.categoryTotals
                  .filter(cat => cat.category === 'EMI' || cat.category === 'Credit Card')
                  .map(cat => cat.category),
                datasets: [{
                  label: 'Amount',
                  data: dashboardData.categoryTotals
                    .filter(cat => cat.category === 'EMI' || cat.category === 'Credit Card')
                    .map(cat => cat.total),
                  backgroundColor: ['#7C3AED', '#EC4899'],
                  borderRadius: 8,
                  barThickness: 40
                }]
              }}
              options={{
                ...chartOptions,
                indexAxis: 'y',
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        <div className="powerbi-card card-50">
          <h3 className="card-title-powerbi">Utilities Breakdown</h3>
          <div className="chart-container-200">
            <Doughnut 
              data={{
                labels: ['Utilities', 'Rent', 'Other'],
                datasets: [{
                  data: [
                    dashboardData.categoryTotals.find(cat => cat.category === 'Utilities')?.total || 0,
                    dashboardData.categoryTotals.find(cat => cat.category === 'Rent')?.total || 0,
                    dashboardData.summary.totalExpense - 
                      (dashboardData.categoryTotals.find(cat => cat.category === 'Utilities')?.total || 0) -
                      (dashboardData.categoryTotals.find(cat => cat.category === 'Rent')?.total || 0)
                  ],
                  backgroundColor: ['#06B6D4', '#EF4444', '#84CC16'],
                  borderWidth: 0
                }]
              }}
              options={donutOptions}
            />
          </div>
        </div>
      </div>

      {/* Row 7 - Spending Trends by Category */}
      <div className="dashboard-row-7">
        <div className="powerbi-card card-full">
          <h3 className="card-title-powerbi">Top Spending Categories This Month</h3>
          <div className="chart-container-200">
            <Bar 
              data={{
                labels: dashboardData.categoryTotals
                  .filter(cat => cat.type === 'expense')
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 8)
                  .map(cat => cat.category),
                datasets: [{
                  label: 'Amount Spent',
                  data: dashboardData.categoryTotals
                    .filter(cat => cat.type === 'expense')
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 8)
                    .map(cat => cat.total),
                  backgroundColor: chartColors,
                  borderRadius: 6,
                  barThickness: 24
                }]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Advanced Analytics Sections */}
      <div className="section-divider">
        <h2 className="section-heading">Advanced Analytics</h2>
        <p className="section-subheading">Deep insights into your financial patterns and trends</p>
      </div>

      {/* Section 1 - Financial Pulse ECG */}
      <div className="ecg-section">
        <div className="ecg-card">
          <div className="ecg-header">
            <div className="ecg-title-row">
              <h3 className="ecg-title">Financial Pulse</h3>
              <div className="pulse-dot"></div>
            </div>
            <p className="ecg-subtitle">Daily net balance movement this month</p>
          </div>
          <div className="ecg-chart-container">
            <Line 
              data={{
                labels: analyticsData.dailyNet.map(d => new Date(d.date).getDate()),
                datasets: [{
                  data: analyticsData.dailyNet.map(d => d.net),
                  borderColor: '#34D399',
                  borderWidth: 2,
                  fill: false,
                  tension: 0,
                  pointRadius: 0
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 2000,
                  easing: 'easeInOutQuart'
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#032221',
                    titleFont: { size: 10, family: 'Inter' },
                    bodyFont: { size: 9, family: 'Inter' },
                    padding: 8,
                    cornerRadius: 6,
                    callbacks: {
                      label: (context) => `Net: Rs ${context.parsed.y.toFixed(0)}`
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { 
                      color: 'rgba(241, 247, 246, 0.3)',
                      font: { size: 8, family: 'Inter' }
                    }
                  },
                  y: {
                    display: false
                  }
                },
                elements: {
                  line: {
                    borderWidth: 2
                  }
                }
              }}
            />
            <div className="ecg-zero-line"></div>
          </div>
        </div>
      </div>

      {/* Section 2 - Multi Chart Analytics Row */}
      <div className="section-divider-small">
        <h2 className="section-heading">Distribution Analysis</h2>
      </div>
      <div className="multi-chart-row">
        <div className="powerbi-card card-25">
          <h3 className="card-title-powerbi">Spending Distribution</h3>
          <div className="chart-container-200">
            <Bar 
              data={{
                labels: Object.keys(analyticsData.spendingDistribution),
                datasets: [{
                  label: 'Count',
                  data: Object.values(analyticsData.spendingDistribution),
                  backgroundColor: '#A78BFA',
                  borderWidth: 0,
                  barPercentage: 1.0,
                  categoryPercentage: 1.0
                }]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        <div className="powerbi-card card-25">
          <h3 className="card-title-powerbi">Category vs Amount Scatter</h3>
          <div className="chart-container-200">
            <div className="scatter-plot-container">
              {analyticsData.allTransactions.slice(0, 50).map((txn, index) => {
                const categories = [...new Set(analyticsData.allTransactions.map(t => t.category))];
                const xPos = (categories.indexOf(txn.category) / categories.length) * 100;
                const maxAmount = Math.max(...analyticsData.allTransactions.map(t => t.amount));
                const yPos = 100 - ((txn.amount / maxAmount) * 90);
                return (
                  <div 
                    key={index}
                    className="scatter-dot"
                    style={{
                      left: `${xPos}%`,
                      top: `${yPos}%`,
                      backgroundColor: getCategoryColor(txn.category)
                    }}
                    title={`${txn.category}: Rs ${txn.amount}`}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="powerbi-card card-25">
          <h3 className="card-title-powerbi">Monthly Spending Range</h3>
          <div className="chart-container-200">
            <Bar 
              data={{
                labels: analyticsData.cumulativeSavings.slice(-6).map(d => {
                  const date = new Date(d.month + '-01');
                  return date.toLocaleDateString('en-US', { month: 'short' });
                }),
                datasets: [{
                  label: 'Range',
                  data: analyticsData.cumulativeSavings.slice(-6).map(() => Math.random() * 5000 + 1000),
                  backgroundColor: '#14B8A6',
                  borderWidth: 0
                }]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        <div className="powerbi-card card-25">
          <h3 className="card-title-powerbi">Income Sources</h3>
          <div className="chart-container-200">
            <Doughnut 
              data={{
                labels: analyticsData.moneyFlow.income.map(i => i.category),
                datasets: [{
                  data: analyticsData.moneyFlow.income.map(i => i.total),
                  backgroundColor: analyticsData.moneyFlow.income.map(i => getCategoryColor(i.category)),
                  borderWidth: 0
                }]
              }}
              options={{
                ...donutOptions,
                cutout: '0%',
                plugins: {
                  ...donutOptions.plugins,
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                      boxWidth: 8,
                      boxHeight: 8,
                      padding: 4,
                      font: { size: 8, family: 'Inter' }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Section 3 - Heatmap Section */}
      <div className="section-divider-small">
        <h2 className="section-heading">Spending Patterns</h2>
      </div>
      <div className="heatmap-section-row">
        <div className="powerbi-card card-60">
          <h3 className="card-title-powerbi">Spending Heatmap by Category and Month</h3>
          <div className="category-heatmap-container">
            {(() => {
              const categories = ['Rent', 'Food', 'Transport', 'Health', 'Entertainment', 'Shopping', 'Credit Card', 'EMI', 'Utilities'];
              const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'];
              const maxAmount = Math.max(...analyticsData.categoryMonthMatrix.map(m => m.total), 1);
              
              return (
                <div className="heatmap-grid-custom">
                  <div className="heatmap-header-row">
                    <div className="heatmap-corner"></div>
                    {months.map(month => (
                      <div key={month} className="heatmap-month-label">
                        {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    ))}
                  </div>
                  {categories.map(category => (
                    <div key={category} className="heatmap-data-row">
                      <div className="heatmap-category-label">{category}</div>
                      {months.map(month => {
                        const cell = analyticsData.categoryMonthMatrix.find(m => m.category === category && m.month === month);
                        const amount = cell ? cell.total : 0;
                        const intensity = amount / maxAmount;
                        const bgColor = intensity === 0 ? '#E8F5EE' : 
                          `rgb(${3 + (232 - 3) * (1 - intensity)}, ${34 + (245 - 34) * (1 - intensity)}, ${33 + (238 - 33) * (1 - intensity)})`;
                        const textColor = intensity > 0.5 ? '#F1F7F6' : '#032221';
                        
                        return (
                          <div 
                            key={`${category}-${month}`}
                            className="heatmap-cell-custom"
                            style={{ backgroundColor: bgColor, color: textColor }}
                            title={`${category} - ${month}: Rs ${amount.toFixed(0)}`}
                          >
                            {amount > 0 ? `${(amount / 1000).toFixed(1)}K` : '-'}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="powerbi-card card-40">
          <h3 className="card-title-powerbi">When Do You Spend Most</h3>
          <div className="day-week-heatmap-container">
            {(() => {
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
              
              return (
                <div className="day-week-heatmap-grid">
                  <div className="day-week-header-row">
                    <div className="day-week-corner"></div>
                    {days.map(day => (
                      <div key={day} className="day-week-day-label">{day}</div>
                    ))}
                  </div>
                  {weeks.map((week, weekIndex) => (
                    <div key={week} className="day-week-data-row">
                      <div className="day-week-week-label">{week}</div>
                      {days.map((day, dayIndex) => {
                        const amount = Math.random() * 3000;
                        const intensity = amount / 3000;
                        const bgColor = intensity === 0 ? '#E8F5EE' : 
                          `rgb(${3 + (232 - 3) * (1 - intensity)}, ${34 + (245 - 34) * (1 - intensity)}, ${33 + (238 - 33) * (1 - intensity)})`;
                        const textColor = intensity > 0.5 ? '#F1F7F6' : '#032221';
                        
                        return (
                          <div 
                            key={`${week}-${day}`}
                            className="day-week-cell"
                            style={{ backgroundColor: bgColor, color: textColor }}
                          >
                            {amount > 0 ? `${(amount / 1000).toFixed(1)}K` : '-'}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Section 4 - Trend Analysis Row */}
      <div className="section-divider-small">
        <h2 className="section-heading">Trend Analysis</h2>
      </div>
      <div className="trend-analysis-row">
        <div className="powerbi-card card-33">
          <h3 className="card-title-powerbi">Cumulative Savings Growth</h3>
          <div className="chart-container-200">
            <Line 
              data={{
                labels: analyticsData.cumulativeSavings.map(d => {
                  const date = new Date(d.month + '-01');
                  return date.toLocaleDateString('en-US', { month: 'short' });
                }),
                datasets: [{
                  label: 'Cumulative',
                  data: analyticsData.cumulativeSavings.map(d => d.cumulative),
                  borderColor: analyticsData.cumulativeSavings.length > 0 && analyticsData.cumulativeSavings[analyticsData.cumulativeSavings.length - 1].cumulative >= 0 ? '#10B981' : '#DC2626',
                  backgroundColor: analyticsData.cumulativeSavings.length > 0 && analyticsData.cumulativeSavings[analyticsData.cumulativeSavings.length - 1].cumulative >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 3
                }]
              }}
              options={lineChartOptions}
            />
          </div>
        </div>

        <div className="powerbi-card card-33">
          <h3 className="card-title-powerbi">Month over Month Expense Change</h3>
          <div className="chart-container-200">
            <Bar 
              data={{
                labels: analyticsData.expenseChanges.map(d => {
                  const date = new Date(d.month + '-01');
                  return date.toLocaleDateString('en-US', { month: 'short' });
                }),
                datasets: [{
                  label: 'Change %',
                  data: analyticsData.expenseChanges.map(d => d.change),
                  backgroundColor: analyticsData.expenseChanges.map(d => d.change >= 0 ? '#F43F5E' : '#34D399'),
                  borderWidth: 0
                }]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        <div className="powerbi-card card-33">
          <h3 className="card-title-powerbi">Savings Rate Trend</h3>
          <div className="chart-container-200">
            <Line 
              data={{
                labels: analyticsData.savingsRates.map(d => {
                  const date = new Date(d.month + '-01');
                  return date.toLocaleDateString('en-US', { month: 'short' });
                }),
                datasets: [{
                  label: 'Savings Rate %',
                  data: analyticsData.savingsRates.map(d => d.savingsRate),
                  borderColor: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 2,
                  fill: false,
                  tension: 0.3,
                  pointRadius: 4,
                  pointBorderColor: '#FFFFFF',
                  pointBorderWidth: 2,
                  segment: {
                    borderColor: (ctx) => {
                      const value = ctx.p1.parsed.y;
                      return value >= 20 ? '#10B981' : value >= 10 ? '#F59E0B' : '#DC2626';
                    }
                  }
                }]
              }}
              options={lineChartOptions}
            />
          </div>
        </div>
      </div>

      {/* Section 5 - Money Flow Network */}
      <div className="section-divider-small">
        <h2 className="section-heading">Money Flow Network</h2>
      </div>
      <div className="network-section">
        <div className="powerbi-card card-full">
          <h3 className="card-title-powerbi">Money Flow Network</h3>
          <div className="network-diagram-container">
            {(() => {
              const incomeData = analyticsData.moneyFlow.income.slice(0, 6).sort((a, b) => b.total - a.total);
              const expenseData = analyticsData.moneyFlow.expense.slice(0, 6).sort((a, b) => b.total - a.total);
              
              const svgWidth = 1000;
              const svgHeight = 240;
              const circleRadius = 28;
              const centerRadius = 36;
              
              const leftX = svgWidth * 0.12;
              const centerX = svgWidth * 0.5;
              const rightX = svgWidth * 0.88;
              const centerY = svgHeight * 0.5;
              
              const incomeCount = incomeData.length;
              const expenseCount = expenseData.length;
              
              const formatAmount = (amount) => {
                if (amount >= 100000) {
                  return `Rs ${(amount / 100000).toFixed(1)}L`;
                } else if (amount >= 1000) {
                  return `Rs ${(amount / 1000).toFixed(0)}K`;
                } else {
                  return `Rs ${amount.toFixed(0)}`;
                }
              };
              
              const getCategoryLabel = (category) => {
                if (category === 'Credit Card') return 'Cr Card';
                if (category === 'Entertainment') return 'Entertain';
                return category;
              };
              
              return (
                <svg width="100%" height="240" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <marker id="arrowIncome" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                      <polygon points="0 0, 6 3, 0 6" fill="#10B981" opacity="0.6" />
                    </marker>
                    <marker id="arrowExpense" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                      <polygon points="0 0, 6 3, 0 6" fill="#F97316" opacity="0.6" />
                    </marker>
                  </defs>
                  
                  {/* Income lines */}
                  {incomeData.map((source, index) => {
                    const y = (svgHeight / (incomeCount + 1)) * (index + 1);
                    const x1 = leftX + circleRadius;
                    const y1 = y;
                    const x2 = centerX - centerRadius;
                    const y2 = centerY;
                    return (
                      <line 
                        key={`income-line-${index}`}
                        x1={x1} 
                        y1={y1} 
                        x2={x2} 
                        y2={y2} 
                        stroke="#10B981" 
                        strokeWidth="1.5" 
                        opacity="0.6"
                        markerEnd="url(#arrowIncome)"
                      />
                    );
                  })}
                  
                  {/* Expense lines */}
                  {expenseData.map((expense, index) => {
                    const y = (svgHeight / (expenseCount + 1)) * (index + 1);
                    const x1 = centerX + centerRadius;
                    const y1 = centerY;
                    const x2 = rightX - circleRadius;
                    const y2 = y;
                    return (
                      <line 
                        key={`expense-line-${index}`}
                        x1={x1} 
                        y1={y1} 
                        x2={x2} 
                        y2={y2} 
                        stroke="#F97316" 
                        strokeWidth="1.5" 
                        opacity="0.6"
                        markerEnd="url(#arrowExpense)"
                      />
                    );
                  })}
                  
                  {/* Income circles */}
                  {incomeData.map((source, index) => {
                    const y = (svgHeight / (incomeCount + 1)) * (index + 1);
                    const label = getCategoryLabel(source.category);
                    const fontSize = label.length > 8 ? 7 : 9;
                    return (
                      <g key={`income-${index}`}>
                        <circle 
                          cx={leftX} 
                          cy={y} 
                          r={circleRadius} 
                          fill={getCategoryColor(source.category)} 
                        />
                        <text 
                          x={leftX} 
                          y={y} 
                          textAnchor="middle" 
                          dominantBaseline="middle" 
                          fill="#FFFFFF" 
                          fontSize={fontSize} 
                          fontWeight="600"
                          fontFamily="Inter"
                        >
                          {label}
                        </text>
                        <text 
                          x={leftX} 
                          y={y + circleRadius + 12} 
                          textAnchor="middle" 
                          fill="#6B7280" 
                          fontSize="8"
                          fontFamily="Inter"
                        >
                          {formatAmount(source.total)}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Center wallet node */}
                  <g>
                    <circle 
                      cx={centerX} 
                      cy={centerY} 
                      r={centerRadius} 
                      fill="#032221" 
                      stroke="#10B981" 
                      strokeWidth="2"
                    />
                    <text 
                      x={centerX} 
                      y={centerY - 4} 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      fill="#FFFFFF" 
                      fontSize="10" 
                      fontWeight="700"
                      fontFamily="Inter"
                    >
                      Captiv
                    </text>
                    <text 
                      x={centerX} 
                      y={centerY + 8} 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      fill="#10B981" 
                      fontSize="8"
                      fontFamily="Inter"
                    >
                      Wallet
                    </text>
                  </g>
                  
                  {/* Expense circles */}
                  {expenseData.map((expense, index) => {
                    const y = (svgHeight / (expenseCount + 1)) * (index + 1);
                    const label = getCategoryLabel(expense.category);
                    const fontSize = label.length > 8 ? 7 : 9;
                    return (
                      <g key={`expense-${index}`}>
                        <circle 
                          cx={rightX} 
                          cy={y} 
                          r={circleRadius} 
                          fill={getCategoryColor(expense.category)} 
                        />
                        <text 
                          x={rightX} 
                          y={y} 
                          textAnchor="middle" 
                          dominantBaseline="middle" 
                          fill="#FFFFFF" 
                          fontSize={fontSize} 
                          fontWeight="600"
                          fontFamily="Inter"
                        >
                          {label}
                        </text>
                        <text 
                          x={rightX} 
                          y={y + circleRadius + 12} 
                          textAnchor="middle" 
                          fill="#6B7280" 
                          fontSize="8"
                          fontFamily="Inter"
                        >
                          {formatAmount(expense.total)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
          <div className="network-legend">
            <div className="network-legend-item">
              <div className="network-legend-dot" style={{ backgroundColor: '#10B981' }}></div>
              <span className="network-legend-text">Income Sources</span>
            </div>
            <div className="network-legend-item">
              <div className="network-legend-dot" style={{ backgroundColor: '#F97316' }}></div>
              <span className="network-legend-text">Expense Categories</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
