const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./database');

// Function to parse date from Excel serial number or DD-MMM-YYYY format to YYYY-MM-DD
function parseExcelDate(dateValue) {
  if (!dateValue) return null;
  
  // Handle if it's an Excel serial number
  if (typeof dateValue === 'number') {
    // Excel serial date starts from 1900-01-01
    // JavaScript Date starts from 1970-01-01
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Handle if it's already a Date object
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Parse DD-MMM-YYYY format like 01-Oct-2025
  if (typeof dateValue === 'string') {
    const monthMap = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    
    const parts = dateValue.split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = monthMap[parts[1]];
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  
  return null;
}

// Function to ensure users exist
function ensureUsersExist() {
  return new Promise((resolve, reject) => {
    // Check if users table has data
    db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (result.count >= 3) {
        console.log('Users already exist, skipping user creation');
        resolve();
        return;
      }
      
      // Create users
      const users = [
        { id: 1, username: 'admin1', password: 'admin123', role: 'Admin' },
        { id: 2, username: 'analyst1', password: 'analyst123', role: 'Analyst' },
        { id: 3, username: 'viewer1', password: 'viewer123', role: 'Viewer' }
      ];
      
      let completed = 0;
      
      users.forEach(user => {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        
        db.run(
          'INSERT OR IGNORE INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
          [user.id, user.username, hashedPassword, user.role],
          (err) => {
            if (err) {
              console.error(`Error creating user ${user.username}:`, err);
            } else {
              console.log(`Created user: ${user.username}`);
            }
            
            completed++;
            if (completed === users.length) {
              resolve();
            }
          }
        );
      });
    });
  });
}

// Function to import Excel data
async function importExcelData() {
  try {
    console.log('Starting Excel import...');
    
    // Ensure users exist first
    await ensureUsersExist();
    
    // Read the Excel file
    const workbook = XLSX.readFile('captiv_financial_records.xlsx');
    
    // Get the first sheet (Financial Records)
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Found ${data.length} records in Excel file`);
    
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each row
    for (const row of data) {
      try {
        // Map column names (Excel has spaces in column names)
        const id = row['ID'] || row['id'];
        const userId = row['User ID'] || row['user_id'];
        const amount = row['Amount (Rs)'] || row['amount'];
        const type = row['Type'] || row['type'];
        const category = row['Category'] || row['category'];
        const date = row['Date'] || row['date'];
        const notes = row['Notes'] || row['notes'] || '';
        
        // Check if record already exists
        const existing = await new Promise((resolve, reject) => {
          db.get(
            'SELECT id FROM financial_records WHERE id = ?',
            [id],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Parse date
        const parsedDate = parseExcelDate(date);
        if (!parsedDate) {
          console.error(`Invalid date format for record ${id}: ${date}`);
          errors++;
          continue;
        }
        
        // Parse amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
          console.error(`Invalid amount for record ${id}: ${amount}`);
          errors++;
          continue;
        }
        
        // Insert record
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO financial_records (id, amount, type, category, date, notes, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [id, parsedAmount, type, category, parsedDate, notes, userId],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        
        inserted++;
      } catch (error) {
        console.error(`Error processing record:`, error.message);
        errors++;
      }
    }
    
    console.log(`\nImport complete:`);
    console.log(`- Inserted: ${inserted} records`);
    console.log(`- Skipped: ${skipped} records (already exist)`);
    console.log(`- Errors: ${errors} records`);
    console.log(`Imported ${inserted} records from captiv_financial_records.xlsx`);
    
    return { inserted, skipped, errors };
  } catch (error) {
    console.error('Error importing Excel data:', error);
    throw error;
  }
}

// Function to check if import is needed
function checkAndImport() {
  return new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM financial_records', [], async (err, result) => {
      if (err) {
        console.log('Could not check records count, skipping import');
        resolve({ inserted: 0, skipped: 0, errors: 0 });
        return;
      }
      
      if (result.count < 200) {
        console.log(`Database has ${result.count} records, importing from Excel...`);
        try {
          const stats = await importExcelData();
          resolve(stats);
        } catch (error) {
          console.log('Excel import skipped:', error.message);
          resolve({ inserted: 0, skipped: 0, errors: 0 });
        }
      } else {
        console.log(`Database already has ${result.count} records, skipping import`);
        resolve({ inserted: 0, skipped: result.count, errors: 0 });
      }
    });
  });
}

// Export functions
module.exports = {
  importExcelData,
  checkAndImport,
  ensureUsersExist
};

// Run import if called directly
if (require.main === module) {
  // Initialize database first
  initDatabase();
  
  // Wait a bit for database to be ready
  setTimeout(() => {
    checkAndImport()
      .then(() => {
        console.log('Import process completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Import process failed:', error);
        process.exit(1);
      });
  }, 1000);
}
