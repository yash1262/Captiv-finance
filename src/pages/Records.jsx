import React, { useState, useEffect } from 'react';
import './Records.css';
import API_BASE from '../config';

function Records() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0
  });
  
  const [filters, setFilters] = useState({
    type: 'All',
    category: 'All Categories',
    startDate: '',
    endDate: '',
    search: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  const categories = [
    'Salary', 'Rent', 'Food', 'Transport', 'Health', 'Entertainment', 
    'Shopping', 'Credit Card', 'EMI', 'Utilities', 'Education', 'Gifts', 
    'Freelance', 'Bonus', 'Interest', 'Rental', 'Personal Care'
  ];

  const categoryColors = {
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

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, filters]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRecords(data.records || []);
      calculateSummary(data.records || []);
    } catch (error) {
      console.error('Error loading records:', error);
      showToast('Failed to load records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (recordsList) => {
    const totalIncome = recordsList
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpense = recordsList
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    
    setSummary({
      totalRecords: recordsList.length,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense
    });
  };

  const applyFilters = () => {
    let filtered = [...records];

    if (filters.type !== 'All') {
      filtered = filtered.filter(r => r.type === filters.type.toLowerCase());
    }

    if (filters.category !== 'All Categories') {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    if (filters.startDate) {
      filtered = filtered.filter(r => r.date >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter(r => r.date <= filters.endDate);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        (r.notes && r.notes.toLowerCase().includes(searchLower)) ||
        r.category.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: 'All',
      category: 'All Categories',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast('Record saved successfully', 'success');
        setShowAddModal(false);
        resetForm();
        loadRecords();
      } else {
        showToast('Failed to save record', 'error');
      }
    } catch (error) {
      console.error('Error adding record:', error);
      showToast('Failed to save record', 'error');
    }
  };

  const handleEditRecord = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/records/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast('Record updated successfully', 'success');
        setShowEditModal(false);
        resetForm();
        loadRecords();
      } else {
        showToast('Failed to update record', 'error');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      showToast('Failed to update record', 'error');
    }
  };

  const handleDeleteRecord = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/records/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('Record deleted successfully', 'success');
        setShowDeleteModal(false);
        setSelectedRecord(null);
        loadRecords();
      } else {
        showToast('Failed to delete record', 'error');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      showToast('Failed to delete record', 'error');
    }
  };

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setFormData({
      amount: record.amount,
      type: record.type,
      category: record.category,
      date: record.date,
      notes: record.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString().slice(0, 10),
      notes: ''
    });
    setSelectedRecord(null);
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₹', 'Rs ');
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Type', 'Amount', 'Notes'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.category,
      r.type,
      r.amount,
      r.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  if (loading) {
    return (
      <div className="records-page">
        <div className="loading-state">Loading records...</div>
      </div>
    );
  }

  return (
    <div className="records-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header-row">
        <h1 className="page-title">Records</h1>
        <div className="header-actions">
          <button className="export-btn" onClick={exportToCSV}>
            Export CSV
          </button>
          <button className="add-record-btn" onClick={() => setShowAddModal(true)}>
            Add Record
          </button>
        </div>
      </div>

      <div className="summary-strip">
        <div className="stat-chip">
          <div className="stat-label">TOTAL RECORDS</div>
          <div className="stat-value">{summary.totalRecords}</div>
        </div>
        <div className="stat-chip">
          <div className="stat-label">TOTAL INCOME</div>
          <div className="stat-value income-color">{formatCurrency(summary.totalIncome)}</div>
        </div>
        <div className="stat-chip">
          <div className="stat-label">TOTAL EXPENSES</div>
          <div className="stat-value expense-color">{formatCurrency(summary.totalExpense)}</div>
        </div>
        <div className="stat-chip">
          <div className="stat-label">NET BALANCE</div>
          <div className={`stat-value ${summary.netBalance >= 0 ? 'income-color' : 'expense-color'}`}>
            {formatCurrency(summary.netBalance)}
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-section">
          <span className="filter-label">Type:</span>
          <div className="type-toggle">
            {['All', 'Income', 'Expense'].map(type => (
              <button
                key={type}
                className={`type-btn ${filters.type === type ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, type })}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <span className="filter-label">Category:</span>
          <select
            className="category-select"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option>All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-section">
          <span className="filter-label">From:</span>
          <input
            type="date"
            className="date-input"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>

        <div className="filter-section">
          <span className="filter-label">To:</span>
          <input
            type="date"
            className="date-input"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search by notes or category"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <button className="clear-filters-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {currentRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No records found</div>
          <div className="empty-subtitle">
            {filters.type !== 'All' || filters.category !== 'All Categories' || filters.search
              ? 'Try adjusting your filters'
              : 'Start by adding your first financial record'}
          </div>
          <button className="empty-action-btn" onClick={() => setShowAddModal(true)}>
            Add Record
          </button>
        </div>
      ) : (
        <>
          <div className="records-table-container">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Notes</th>
                  <th className="text-right">Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((record, index) => (
                  <tr key={record.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="date-cell">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      <span
                        className="category-badge"
                        style={{ backgroundColor: categoryColors[record.category] + '20', color: categoryColors[record.category] }}
                      >
                        {record.category}
                      </span>
                    </td>
                    <td>
                      <span className={`type-badge type-${record.type}`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="notes-cell">{record.notes || '-'}</td>
                    <td className={`amount-cell ${record.type === 'income' ? 'income-color' : 'expense-color'}`}>
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="actions-cell">
                      <button className="edit-btn" onClick={() => openEditModal(record)}>
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => openDeleteModal(record)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <div className="pagination-info">
              Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} records
            </div>
            <div className="pagination-buttons">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <div className="pagination-nav">
              <button
                className="nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <button
                className="nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            <h2 className="modal-title">Add New Record</h2>
            <form onSubmit={handleAddRecord}>
              <div className="form-field">
                <label>Amount</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>
              <div className="form-field">
                <label>Type</label>
                <div className="type-toggle-large">
                  <button
                    type="button"
                    className={`type-btn-large ${formData.type === 'income' ? 'active-income' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={`type-btn-large ${formData.type === 'expense' ? 'active-expense' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                  >
                    Expense
                  </button>
                </div>
              </div>
              <div className="form-field">
                <label>Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add notes (optional)"
                />
              </div>
              <button type="submit" className="submit-btn">Save Record</button>
              <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            <h2 className="modal-title">Edit Record</h2>
            <form onSubmit={handleEditRecord}>
              <div className="form-field">
                <label>Amount</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Type</label>
                <div className="type-toggle-large">
                  <button
                    type="button"
                    className={`type-btn-large ${formData.type === 'income' ? 'active-income' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={`type-btn-large ${formData.type === 'expense' ? 'active-expense' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                  >
                    Expense
                  </button>
                </div>
              </div>
              <div className="form-field">
                <label>Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <button type="submit" className="submit-btn">Update Record</button>
              <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card modal-small" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Record</h2>
            <p className="delete-message">
              Are you sure you want to delete this record? This cannot be undone.
            </p>
            <button className="delete-confirm-btn" onClick={handleDeleteRecord}>
              Confirm Delete
            </button>
            <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Records;
