const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

// Register new user
function register(req, res) {
  const { username, password, role } = req.body;

  // Validate input
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }

  // Check valid role
  const validRoles = ['Viewer', 'Analyst', 'Admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Role must be Viewer, Analyst, or Admin' });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Insert user into database
  const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
  db.run(query, [username, hashedPassword, role], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(500).json({ error: 'Failed to create user' });
    }

    res.status(201).json({
      message: 'User created successfully',
      userId: this.lastID
    });
  });
}

// Login user
function login(req, res) {
  console.log('=== LOGIN ROUTE HIT ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  const { username, password } = req.body;

  if (!username || !password) {
    console.log('ERROR: Missing username or password');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  console.log('Looking up user in database:', username);

  // Find user
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('DATABASE ERROR:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      console.log('ERROR: User not found in database:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    console.log('SUCCESS: User found in database');
    console.log('User ID:', user.id);
    console.log('Username:', user.username);
    console.log('Role:', user.role);
    console.log('Is Active:', user.is_active);

    if (user.is_active === 0) {
      console.log('ERROR: User account is deactivated');
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Check password
    console.log('Comparing password...');
    const passwordMatch = bcrypt.compareSync(password, user.password);
    console.log('Password match result:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('ERROR: Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('SUCCESS: Login successful for user:', user.username);
    console.log('Token generated, sending response...');

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
}

module.exports = { register, login };
