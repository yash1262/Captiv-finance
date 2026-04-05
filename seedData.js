const bcrypt = require('bcryptjs');
const { db } = require('./database');

function seedDatabase() {
  console.log('Seeding database - always runs on every server start...');
  
  db.serialize(() => {
    db.run('DELETE FROM financial_records', (err) => {
      if (err) console.error('Error deleting records:', err);
      else console.log('Cleared financial_records');
    });
    
    db.run('DELETE FROM users', (err) => {
      if (err) { console.error('Error deleting users:', err); return; }
      console.log('Cleared users');
      
      const hash_yash = bcrypt.hashSync('yash@123', 10);
      const hash_admin = bcrypt.hashSync('admin123', 10);
      const hash_analyst = bcrypt.hashSync('analyst123', 10);
      const hash_viewer = bcrypt.hashSync('viewer123', 10);
      
      db.run('INSERT INTO users (username, password, role, is_active) VALUES (?,?,?,1)', ['yash', hash_yash, 'Admin'], function(err) {
        if (err) { console.error('Error inserting yash:', err); return; }
        const yashId = this.lastID;
        
        db.run('INSERT INTO users (username, password, role, is_active) VALUES (?,?,?,1)', ['admin1', hash_admin, 'Admin'], function(err) {
          if (err) { console.error('Error inserting admin1:', err); return; }
          const admin1Id = this.lastID;
          
          db.run('INSERT INTO users (username, password, role, is_active) VALUES (?,?,?,1)', ['analyst1', hash_analyst, 'Analyst'], function(err) {
            if (err) { console.error('Error inserting analyst1:', err); return; }
            const analyst1Id = this.lastID;
            
            db.run('INSERT INTO users (username, password, role, is_active) VALUES (?,?,?,1)', ['viewer1', hash_viewer, 'Viewer'], function(err) {
              if (err) { console.error('Error inserting viewer1:', err); return; }
              const viewer1Id = this.lastID;
              
              console.log('All users created:', yashId, admin1Id, analyst1Id, viewer1Id);
              
              insertRecords(yashId, admin1Id, analyst1Id);
            });
          });
        });
      });
    });
  });
}

function insertRecords(yashId, admin1Id, analyst1Id) {
  const records = [
    // yash records - 6 months full data
    [54000,'income','Salary','2025-10-01','October salary',yashId],
    [12000,'income','Freelance','2025-10-10','Website project',yashId],
    [12000,'expense','Rent','2025-10-02','Monthly rent',yashId],
    [1200,'expense','Utilities','2025-10-03','Electricity bill',yashId],
    [799,'expense','Utilities','2025-10-04','Internet bill',yashId],
    [399,'expense','Utilities','2025-10-05','Mobile recharge',yashId],
    [1800,'expense','Food','2025-10-06','Weekly groceries',yashId],
    [650,'expense','Food','2025-10-09','Restaurant dinner',yashId],
    [320,'expense','Transport','2025-10-07','Ola cab',yashId],
    [499,'expense','Entertainment','2025-10-08','Netflix subscription',yashId],
    [1200,'expense','Shopping','2025-10-15','Clothes',yashId],
    [2500,'expense','Health','2025-10-18','Doctor visit',yashId],
    [3000,'expense','Education','2025-10-25','Udemy course',yashId],
    [54000,'income','Salary','2025-11-01','November salary',yashId],
    [8500,'income','Freelance','2025-11-15','App design project',yashId],
    [15000,'income','Bonus','2025-11-12','Diwali bonus',yashId],
    [2000,'income','Investment','2025-11-20','Mutual fund return',yashId],
    [12000,'expense','Rent','2025-11-02','Monthly rent',yashId],
    [980,'expense','Utilities','2025-11-03','Electricity bill',yashId],
    [799,'expense','Utilities','2025-11-04','Internet bill',yashId],
    [2200,'expense','Food','2025-11-06','Weekly groceries',yashId],
    [4500,'expense','Shopping','2025-11-13','Diwali shopping',yashId],
    [1800,'expense','Entertainment','2025-11-14','Concert tickets',yashId],
    [500,'expense','Health','2025-11-22','Gym membership',yashId],
    [2000,'expense','Education','2025-11-25','Coursera subscription',yashId],
    [55000,'income','Salary','2025-12-01','December salary',yashId],
    [18000,'income','Freelance','2025-12-08','SEO work project',yashId],
    [5000,'income','Gift','2025-12-20','Birthday gift from parents',yashId],
    [1500,'income','Investment','2025-12-15','Stock dividend',yashId],
    [12000,'expense','Rent','2025-12-02','Monthly rent',yashId],
    [1500,'expense','Utilities','2025-12-03','Electricity bill',yashId],
    [799,'expense','Utilities','2025-12-04','Internet bill',yashId],
    [2800,'expense','Food','2025-12-06','Weekly groceries',yashId],
    [6000,'expense','Shopping','2025-12-18','Year end shopping',yashId],
    [2500,'expense','Entertainment','2025-12-24','New year party',yashId],
    [3500,'expense','Health','2025-12-14','Dental checkup',yashId],
    [56000,'income','Salary','2026-01-01','January salary',yashId],
    [22000,'income','Freelance','2026-01-10','Logo design project',yashId],
    [8000,'income','Bonus','2026-01-15','Project completion bonus',yashId],
    [1400,'income','Investment','2026-01-28','SIP withdrawal',yashId],
    [12000,'expense','Rent','2026-01-02','Monthly rent',yashId],
    [1100,'expense','Utilities','2026-01-03','Electricity bill',yashId],
    [799,'expense','Utilities','2026-01-04','Internet bill',yashId],
    [1900,'expense','Food','2026-01-06','Weekly groceries',yashId],
    [4500,'expense','Shopping','2026-01-20','Winter clothes',yashId],
    [8000,'expense','Education','2026-01-22','Workshop fee',yashId],
    [900,'expense','Health','2026-01-25','Lab tests',yashId],
    [56000,'income','Salary','2026-02-01','February salary',yashId],
    [14000,'income','Freelance','2026-02-12','Website redesign',yashId],
    [4200,'income','Investment','2026-02-18','Mutual fund return',yashId],
    [12000,'expense','Rent','2026-02-02','Monthly rent',yashId],
    [850,'expense','Utilities','2026-02-03','Electricity bill',yashId],
    [799,'expense','Utilities','2026-02-04','Internet bill',yashId],
    [2100,'expense','Food','2026-02-06','Weekly groceries',yashId],
    [950,'expense','Food','2026-02-14','Valentines dinner',yashId],
    [3200,'expense','Shopping','2026-02-10','Electronics accessory',yashId],
    [499,'expense','Entertainment','2026-02-15','Movie tickets',yashId],
    [1800,'expense','Health','2026-02-22','Doctor visit',yashId],
    [2500,'expense','Education','2026-02-25','Book purchase',yashId],
    [58000,'income','Salary','2026-03-01','March salary',yashId],
    [16000,'income','Freelance','2026-03-10','Mobile app project',yashId],
    [12000,'expense','Rent','2026-03-02','Monthly rent',yashId],
    [1300,'expense','Utilities','2026-03-03','Electricity bill',yashId],
    [799,'expense','Utilities','2026-03-04','Internet bill',yashId],
    [2400,'expense','Food','2026-03-06','Weekly groceries',yashId],
    [999,'expense','Entertainment','2026-03-08','Gaming purchase',yashId],
    [5500,'expense','Shopping','2026-03-18','New shoes',yashId],
    [1200,'expense','Health','2026-03-22','Gym membership',yashId],
    [4000,'expense','Education','2026-03-25','Online course',yashId],
    [58000,'income','Salary','2026-04-01','April salary',yashId],
    [12000,'expense','Rent','2026-04-02','Monthly rent',yashId],
    [799,'expense','Utilities','2026-04-03','Internet bill',yashId],
    [1600,'expense','Food','2026-04-03','Weekly groceries',yashId],
    [420,'expense','Transport','2026-04-04','Ola cab',yashId],
    [199,'expense','Entertainment','2026-04-05','Netflix subscription',yashId],
    
    // admin1 records
    [62000,'income','Salary','2025-10-01','October salary',admin1Id],
    [15000,'income','Freelance','2025-10-12','Consulting project',admin1Id],
    [12000,'expense','Rent','2025-10-02','Monthly rent',admin1Id],
    [1400,'expense','Utilities','2025-10-03','Electricity bill',admin1Id],
    [799,'expense','Utilities','2025-10-04','Internet bill',admin1Id],
    [2200,'expense','Food','2025-10-07','Weekly groceries',admin1Id],
    [800,'expense','Transport','2025-10-09','Cab rides',admin1Id],
    [3000,'expense','Shopping','2025-10-15','Clothing',admin1Id],
    [62000,'income','Salary','2025-11-01','November salary',admin1Id],
    [20000,'income','Bonus','2025-11-10','Performance bonus',admin1Id],
    [12000,'expense','Rent','2025-11-02','Monthly rent',admin1Id],
    [1100,'expense','Utilities','2025-11-03','Electricity bill',admin1Id],
    [2500,'expense','Food','2025-11-06','Groceries and dining',admin1Id],
    [5000,'expense','Shopping','2025-11-12','Electronics',admin1Id],
    [1500,'expense','Entertainment','2025-11-18','Events',admin1Id],
    [62000,'income','Salary','2025-12-01','December salary',admin1Id],
    [12000,'expense','Rent','2025-12-02','Monthly rent',admin1Id],
    [3000,'expense','Food','2025-12-10','Groceries',admin1Id],
    [8000,'expense','Shopping','2025-12-20','Christmas shopping',admin1Id],
    [3000,'expense','Entertainment','2025-12-25','Celebrations',admin1Id],
    [65000,'income','Salary','2026-01-01','January salary',admin1Id],
    [12000,'expense','Rent','2026-01-02','Monthly rent',admin1Id],
    [2000,'expense','Food','2026-01-07','Weekly groceries',admin1Id],
    [1200,'expense','Transport','2026-01-10','Travel',admin1Id],
    [65000,'income','Salary','2026-02-01','February salary',admin1Id],
    [12000,'expense','Rent','2026-02-02','Monthly rent',admin1Id],
    [2500,'expense','Food','2026-02-08','Groceries',admin1Id],
    [4000,'expense','Health','2026-02-15','Medical checkup',admin1Id],
    [65000,'income','Salary','2026-03-01','March salary',admin1Id],
    [12000,'expense','Rent','2026-03-02','Monthly rent',admin1Id],
    [2200,'expense','Food','2026-03-07','Groceries',admin1Id],
    [6000,'expense','Shopping','2026-03-20','New gadget',admin1Id],
    [65000,'income','Salary','2026-04-01','April salary',admin1Id],
    [12000,'expense','Rent','2026-04-02','Monthly rent',admin1Id],
    [1800,'expense','Food','2026-04-03','Groceries',admin1Id],
    
    // analyst1 records
    [45000,'income','Salary','2025-10-01','October salary',analyst1Id],
    [8000,'income','Freelance','2025-10-15','Data analysis project',analyst1Id],
    [10000,'expense','Rent','2025-10-02','Monthly rent',analyst1Id],
    [900,'expense','Utilities','2025-10-03','Electricity bill',analyst1Id],
    [799,'expense','Utilities','2025-10-04','Internet bill',analyst1Id],
    [1500,'expense','Food','2025-10-06','Weekly groceries',analyst1Id],
    [400,'expense','Transport','2025-10-08','Commute',analyst1Id],
    [45000,'income','Salary','2025-11-01','November salary',analyst1Id],
    [10000,'expense','Rent','2025-11-02','Monthly rent',analyst1Id],
    [1200,'expense','Food','2025-11-05','Groceries',analyst1Id],
    [2000,'expense','Education','2025-11-20','Online course',analyst1Id],
    [45000,'income','Salary','2025-12-01','December salary',analyst1Id],
    [10000,'expense','Rent','2025-12-02','Monthly rent',analyst1Id],
    [1800,'expense','Food','2025-12-07','Groceries',analyst1Id],
    [3000,'expense','Shopping','2025-12-22','Year end shopping',analyst1Id],
    [47000,'income','Salary','2026-01-01','January salary',analyst1Id],
    [10000,'expense','Rent','2026-01-02','Monthly rent',analyst1Id],
    [1400,'expense','Food','2026-01-06','Weekly groceries',analyst1Id],
    [5000,'income','Freelance','2026-01-18','Research project',analyst1Id],
    [47000,'income','Salary','2026-02-01','February salary',analyst1Id],
    [10000,'expense','Rent','2026-02-02','Monthly rent',analyst1Id],
    [1600,'expense','Food','2026-02-07','Groceries',analyst1Id],
    [1200,'expense','Health','2026-02-18','Doctor visit',analyst1Id],
    [47000,'income','Salary','2026-03-01','March salary',analyst1Id],
    [10000,'expense','Rent','2026-03-02','Monthly rent',analyst1Id],
    [1500,'expense','Food','2026-03-06','Groceries',analyst1Id],
    [2500,'expense','Education','2026-03-15','Workshop',analyst1Id],
    [47000,'income','Salary','2026-04-01','April salary',analyst1Id],
    [10000,'expense','Rent','2026-04-02','Monthly rent',analyst1Id],
    [1200,'expense','Food','2026-04-03','Groceries',analyst1Id]
  ];
  
  let inserted = 0;
  let errors = 0;
  
  records.forEach(r => {
    db.run(
      'INSERT INTO financial_records (amount, type, category, date, notes, created_by) VALUES (?,?,?,?,?,?)',
      r,
      function(err) {
        if (err) {
          console.error('Record insert error:', err.message);
          errors++;
        } else {
          inserted++;
        }
        if (inserted + errors === records.length) {
          console.log(`Seed finished - inserted: ${inserted}, errors: ${errors}`);
        }
      }
    );
  });
}

module.exports = { seedDatabase };
