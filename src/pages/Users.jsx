import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config';
import './Users.css';

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'Viewer'
  });

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      
      if (user.role !== 'Admin') {
        return;
      }
      
      loadUsers();
    }
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        showToast('Failed to load users', 'error');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast('User created successfully', 'success');
        setShowAddModal(false);
        resetForm();
        loadUsers();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to create user', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('Failed to create user', 'error');
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE}/api/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: formData.role })
      });

      if (response.ok) {
        showToast('Role updated successfully', 'success');
        setShowEditModal(false);
        resetForm();
        loadUsers();
      } else {
        showToast('Failed to update role', 'error');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showToast('Failed to update role', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`${API_BASE}/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
        loadUsers();
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'Viewer'
    });
    setSelectedUser(null);
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  if (!currentUser) {
    return <div className="users-page"><div className="loading-state">Loading...</div></div>;
  }

  if (currentUser.role !== 'Admin') {
    return (
      <div className="users-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
          <p>Only Admin users can manage users.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-state">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="users-page">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header-row">
        <h1 className="page-title">User Management</h1>
        <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
          Add User
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                <td className="username-cell">{user.username}</td>
                <td>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="edit-btn" onClick={() => openEditModal(user)}>
                    Edit Role
                  </button>
                  <button 
                    className={user.status === 'active' ? 'deactivate-btn' : 'activate-btn'}
                    onClick={() => handleToggleStatus(user)}
                  >
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            <h2 className="modal-title">Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-field">
                <label>Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="form-field">
                <label>Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="form-field">
                <label>Role</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="submit-btn">Create User</button>
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
            <h2 className="modal-title">Edit User Role</h2>
            <form onSubmit={handleEditRole}>
              <div className="form-field">
                <label>Username</label>
                <input
                  type="text"
                  disabled
                  value={formData.username}
                />
              </div>
              <div className="form-field">
                <label>Role</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="submit-btn">Update Role</button>
              <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
