const bcrypt = require('bcryptjs');
const { db } = require('./database');

function seedDatabase() {
  console.log('Starting seed - clearing old data and inserting fresh records...');
  
  db.serialize(() => {
    db.run('DELETE FROM financial_records');
    db.run('DELETE FROM users');
    
    const users = [
      { username: 'yash', password: 'yash@123', role: 'Admin' },
      { username: 'admin1', password: 'admin123', role: 'Admin' },
      { username: 'analyst1', password: 'analyst123', role: 'Analyst' },
      { username: 'viewer1', password: 'viewer123', role: 'Viewer' }
    ];
    
    let adminId = null;
    
    const hash1 = bcrypt.hashSync('yash@123', 10);
    const hash2 = bcrypt.hashSync('admin123', 10);
    const hash3 = bcrypt.hashSync('analyst123', 10);
    const hash4 = bcrypt.hashSync('viewer123', 10);
    
    db.run('INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, 1)', ['yash', hash1, 'Admin'], function(err) {
      if (err) { console.error('Error inserting yash:', err); return; }
      adminId = this.lastID;
      console.log('Created user yash with id:', adminId);
      
      db.run('INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, 1)', ['admin1', hash2, 'Admin']);
      db.run('INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, 1)', ['analyst1', hash3, 'Analyst']);
      db.run('INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, 1)', ['viewer1', hash4, 'Viewer']);
      
      const records = [
        [54000,'income','Salary','2025-10-01','October salary',adminId],
        [12000,'income','Freelance','2025-10-10','Website project',adminId],
        [12000,'expense','Rent','2025-10-02','Monthly rent',adminId],
        [1200,'expense','Utilities','2025-10-03','Electricity bill',adminId],
        [799,'expense','Utilities','2025-10-04','Internet bill',adminId],
        [399,'expense','Utilities','2025-10-05','Mobile recharge',adminId],
        [1800,'expense','Food','2025-10-06','Weekly groceries',adminId],
        [650,'expense','Food','2025-10-09','Restaurant dinner',adminId],
        [320,'expense','Transport','2025-10-07','Ola cab',adminId],
        [180,'expense','Transport','2025-10-12','Auto rickshaw',adminId],
        [499,'expense','Entertainment','2025-10-08','Netflix subscription',adminId],
        [1200,'expense','Shopping','2025-10-15','Clothes',adminId],
        [2500,'expense','Health','2025-10-18','Doctor visit',adminId],
        [1500,'expense','Food','2025-10-20','Zomato orders',adminId],
        [450,'expense','Transport','2025-10-22','Petrol',adminId],
        [3000,'expense','Education','2025-10-25','Udemy course',adminId],
        [800,'expense','Food','2025-10-28','Cafe visits',adminId],
        [54000,'income','Salary','2025-11-01','November salary',adminId],
        [8500,'income','Freelance','2025-11-15','App design project',adminId],
        [2000,'income','Investment','2025-11-20','Mutual fund return',adminId],
        [15000,'income','Bonus','2025-11-12','Diwali bonus',adminId],
        [12000,'expense','Rent','2025-11-02','Monthly rent',adminId],
        [980,'expense','Utilities','2025-11-03','Electricity bill',adminId],
        [799,'expense','Utilities','2025-11-04','Internet bill',adminId],
        [299,'expense','Utilities','2025-11-05','Mobile recharge',adminId],
        [2200,'expense','Food','2025-11-06','Weekly groceries',adminId],
        [850,'expense','Food','2025-11-10','Restaurant dinner',adminId],
        [4500,'expense','Shopping','2025-11-13','Diwali shopping',adminId],
        [200,'expense','Transport','2025-11-08','Auto rickshaw',adminId],
        [1800,'expense','Entertainment','2025-11-14','Concert tickets',adminId],
        [1200,'expense','Food','2025-11-18','Swiggy orders',adminId],
        [500,'expense','Health','2025-11-22','Gym membership',adminId],
        [2000,'expense','Education','2025-11-25','Coursera subscription',adminId],
        [380,'expense','Transport','2025-11-27','Rapido rides',adminId],
        [55000,'income','Salary','2025-12-01','December salary',adminId],
        [18000,'income','Freelance','2025-12-08','SEO work project',adminId],
        [5000,'income','Gift','2025-12-20','Birthday gift from parents',adminId],
        [1500,'income','Investment','2025-12-15','Stock dividend',adminId],
        [12000,'expense','Rent','2025-12-02','Monthly rent',adminId],
        [1500,'expense','Utilities','2025-12-03','Electricity bill',adminId],
        [799,'expense','Utilities','2025-12-04','Internet bill',adminId],
        [499,'expense','Utilities','2025-12-05','Mobile recharge',adminId],
        [2800,'expense','Food','2025-12-06','Weekly groceries',adminId],
        [1200,'expense','Food','2025-12-12','Christmas dinner',adminId],
        [6000,'expense','Shopping','2025-12-18','Year end shopping',adminId],
        [2500,'expense','Entertainment','2025-12-24','New year party',adminId],
        [600,'expense','Transport','2025-12-10','Ola cab rides',adminId],
        [3500,'expense','Health','2025-12-14','Dental checkup',adminId],
        [1800,'expense','Food','2025-12-22','Zomato orders',adminId],
        [800,'expense','Shopping','2025-12-28','Books and stationery',adminId],
        [56000,'income','Salary','2026-01-01','January salary',adminId],
        [22000,'income','Freelance','2026-01-10','Logo design project',adminId],
        [8000,'income','Bonus','2026-01-15','Project completion bonus',adminId],
        [1400,'income','Investment','2026-01-28','SIP withdrawal',adminId],
        [12000,'expense','Rent','2026-01-02','Monthly rent',adminId],
        [1100,'expense','Utilities','2026-01-03','Electricity bill',adminId],
        [799,'expense','Utilities','2026-01-04','Internet bill',adminId],
        [399,'expense','Utilities','2026-01-05','Mobile recharge',adminId],
        [1900,'expense','Food','2026-01-06','Weekly groceries',adminId],
        [700,'expense','Food','2026-01-09','Cafe visit',adminId],
        [250,'expense','Transport','2026-01-07','Auto rickshaw',adminId],
        [550,'expense','Transport','2026-01-14','Petrol',adminId],
        [199,'expense','Entertainment','2026-01-08','Spotify subscription',adminId],
        [4500,'expense','Shopping','2026-01-20','Winter clothes',adminId],
        [1200,'expense','Food','2026-01-18','Swiggy orders',adminId],
        [8000,'expense','Education','2026-01-22','Workshop fee',adminId],
        [900,'expense','Health','2026-01-25','Lab tests',adminId],
        [300,'expense','Food','2026-01-30','Restaurant lunch',adminId],
        [56000,'income','Salary','2026-02-01','February salary',adminId],
        [14000,'income','Freelance','2026-02-12','Website redesign',adminId],
        [4200,'income','Investment','2026-02-18','Mutual fund return',adminId],
        [12000,'expense','Rent','2026-02-02','Monthly rent',adminId],
        [850,'expense','Utilities','2026-02-03','Electricity bill',adminId],
        [799,'expense','Utilities','2026-02-04','Internet bill',adminId],
        [299,'expense','Utilities','2026-02-05','Mobile recharge',adminId],
        [2100,'expense','Food','2026-02-06','Weekly groceries',adminId],
        [950,'expense','Food','2026-02-14','Valentines dinner',adminId],
        [400,'expense','Transport','2026-02-08','Ola cab',adminId],
        [3200,'expense','Shopping','2026-02-10','Electronics accessory',adminId],
        [499,'expense','Entertainment','2026-02-15','Movie tickets',adminId],
        [1500,'expense','Food','2026-02-20','Zomato orders',adminId],
        [1800,'expense','Health','2026-02-22','Doctor visit',adminId],
        [2500,'expense','Education','2026-02-25','Book purchase',adminId],
        [180,'expense','Transport','2026-02-27','Auto rickshaw',adminId],
        [58000,'income','Salary','2026-03-01','March salary',adminId],
        [16000,'income','Freelance','2026-03-10','Mobile app project',adminId],
        [12000,'expense','Rent','2026-03-02','Monthly rent',adminId],
        [1300,'expense','Utilities','2026-03-03','Electricity bill',adminId],
        [799,'expense','Utilities','2026-03-04','Internet bill',adminId],
        [499,'expense','Utilities','2026-03-05','Mobile recharge',adminId],
        [2400,'expense','Food','2026-03-06','Weekly groceries',adminId],
        [780,'expense','Food','2026-03-09','Restaurant dinner',adminId],
        [320,'expense','Transport','2026-03-07','Rapido rides',adminId],
        [500,'expense','Transport','2026-03-15','Petrol',adminId],
        [999,'expense','Entertainment','2026-03-08','Gaming purchase',adminId],
        [5500,'expense','Shopping','2026-03-18','New shoes',adminId],
        [1800,'expense','Food','2026-03-20','Swiggy orders',adminId],
        [1200,'expense','Health','2026-03-22','Gym membership',adminId],
        [4000,'expense','Education','2026-03-25','Online course',adminId],
        [600,'expense','Food','2026-03-28','Cafe visits',adminId],
        [250,'expense','Transport','2026-03-30','Auto rickshaw',adminId],
        [58000,'income','Salary','2026-04-01','April salary',adminId],
        [12000,'expense','Rent','2026-04-02','Monthly rent',adminId],
        [799,'expense','Utilities','2026-04-03','Internet bill',adminId],
        [399,'expense','Utilities','2026-04-04','Mobile recharge',adminId],
        [1600,'expense','Food','2026-04-03','Weekly groceries',adminId],
        [420,'expense','Transport','2026-04-04','Ola cab',adminId],
        [199,'expense','Entertainment','2026-04-05','Netflix subscription',adminId]
      ];
      
      let inserted = 0;
      records.forEach(r => {
        db.run(
          'INSERT INTO financial_records (amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          r,
          function(err) {
            if (err) {
              console.error('Error inserting record:', err);
            } else {
              inserted++;
              if (inserted === records.length) {
                console.log(`Seed complete - inserted ${inserted} records for user yash`);
              }
            }
          }
        );
      });
    });
  });
}

module.exports = { seedDatabase };
