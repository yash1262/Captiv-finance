const { db } = require('../database');

// Get all users
function getAllUsers(req, res) {
  db.all('SELECT id, username, role, is_active, created_at FROM users', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json({ users });
  });
}

// Update user role
function updateUserRole(req, res) {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  const validRoles = ['Viewer', 'Analyst', 'Admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Role must be Viewer, Analyst, or Admin' });
  }

  db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update role' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated successfully' });
  });
}

// Activate or deactivate user
function toggleUserStatus(req, res) {
  const { userId } = req.params;
  const { is_active } = req.body;

  if (is_active === undefined) {
    return res.status(400).json({ error: 'is_active field is required' });
  }

  const activeValue = is_active ? 1 : 0;

  db.run('UPDATE users SET is_active = ? WHERE id = ?', [activeValue, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update user status' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User status updated successfully' });
  });
}

module.exports = { getAllUsers, updateUserRole, toggleUserStatus };
