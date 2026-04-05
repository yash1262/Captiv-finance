const bcrypt = require('bcryptjs');
const { db } = require('./database');

// Seed users and financial records
function seedDatabase() {
  // Check if data already exists
  db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
    if (err) {
      console.error('Error checking existing data:', err);
      return;
    }

    // If users already exist, skip seeding
    if (result.count > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding database with sample data...');

    // Create sample users
    const users = [
      { username: 'admin1', password: 'admin123', role: 'Admin' },
      { username: 'analyst1', password: 'analyst123', role: 'Analyst' },
      { username: 'viewer1', password: 'viewer123', role: 'Viewer' }
    ];

    // Insert users
    const insertUserPromises = users.map(user => {
      return new Promise((resolve, reject) => {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        db.run(
          'INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, 1)',
          [user.username, hashedPassword, user.role],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    });

    Promise.all(insertUserPromises)
      .then(userIds => {
        console.log('Users seeded successfully');
        
        // Get admin1 user ID (first user)
        const admin1UserId = userIds[0];
        
        // Create 200 realistic financial records for admin1 covering last 6 months
        const records = [];
        const today = new Date();
        
        // Generate records for the last 6 months
        for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
          const month = new Date(today);
          month.setMonth(today.getMonth() - monthOffset);
          const monthStr = month.toISOString().slice(0, 7);
          
          // Monthly salary on 1st
          records.push({
            amount: 55000,
            type: 'income',
            category: 'Salary',
            date: `${monthStr}-01`,
            notes: 'Monthly salary',
            created_by: admin1UserId
          });
          
          // Monthly rent on 5th
          records.push({
            amount: 12000,
            type: 'expense',
            category: 'Rent',
            date: `${monthStr}-05`,
            notes: 'Monthly rent payment',
            created_by: admin1UserId
          });
          
          // Utilities on 10th
          records.push({
            amount: 1500 + Math.floor(Math.random() * 500),
            type: 'expense',
            category: 'Utilities',
            date: `${monthStr}-10`,
            notes: 'Electricity bill',
            created_by: admin1UserId
          });
          
          // Groceries - 4 times per month
          for (let week = 0; week < 4; week++) {
            const day = 7 + (week * 7);
            if (day <= 28) {
              records.push({
                amount: 2500 + Math.floor(Math.random() * 1500),
                type: 'expense',
                category: 'Food',
                date: `${monthStr}-${day.toString().padStart(2, '0')}`,
                notes: 'Grocery shopping',
                created_by: admin1UserId
              });
            }
          }
          
          // Transport - every 2 days
          for (let day = 2; day <= 28; day += 2) {
            records.push({
              amount: 150 + Math.floor(Math.random() * 200),
              type: 'expense',
              category: 'Transport',
              date: `${monthStr}-${day.toString().padStart(2, '0')}`,
              notes: 'Auto rickshaw',
              created_by: admin1UserId
            });
          }
          
          // Entertainment - 2 times per month
          records.push({
            amount: 800 + Math.floor(Math.random() * 1200),
            type: 'expense',
            category: 'Entertainment',
            date: `${monthStr}-15`,
            notes: 'Movie tickets',
            created_by: admin1UserId
          });
          records.push({
            amount: 1500 + Math.floor(Math.random() * 2000),
            type: 'expense',
            category: 'Entertainment',
            date: `${monthStr}-22`,
            notes: 'Dinner with friends',
            created_by: admin1UserId
          });
          
          // Shopping - once per month
          records.push({
            amount: 2000 + Math.floor(Math.random() * 3000),
            type: 'expense',
            category: 'Shopping',
            date: `${monthStr}-18`,
            notes: 'Clothing purchase',
            created_by: admin1UserId
          });
        }

        console.log(`Created ${records.length} records for user admin1`);

        // Insert all records
        const insertRecordPromises = records.map(record => {
          return new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO financial_records (amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)',
              [record.amount, record.type, record.category, record.date, record.notes, record.created_by],
              function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
              }
            );
          });
        });

        return Promise.all(insertRecordPromises);
      })
      .then(() => {
        console.log('Financial records seeded successfully');
        console.log('Database seeding complete!');
        console.log('\nSample login credentials:');
        console.log('- Admin: username: admin1, password: admin123');
        console.log('- Analyst: username: analyst1, password: analyst123');
        console.log('- Viewer: username: viewer1, password: viewer123');
      })
      .catch(err => {
        console.error('Error seeding database:', err);
      });
  });
}

module.exports = { seedDatabase };
