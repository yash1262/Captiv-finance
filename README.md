# Finance Dashboard

A professional finance data processing and access control system with a modern analytics dashboard inspired by Tableau, Power BI, and fintech products like Razorpay and Groww.

## Features

- User authentication with JWT tokens
- Role based access control with three roles: Viewer, Analyst, and Admin
- Financial record management with CRUD operations
- Professional analytics dashboard with multiple visualizations
- Real-time date and time display
- Personalized greeting based on time of day
- Financial health summary with plain language insights
- Alert system for expense warnings
- Week at a glance visualization
- Streak counter for daily transaction logging
- Monthly expense goal tracking with progress bar
- Month over month comparison widgets
- Category breakdown with interactive charts
- Daily cash flow trend analysis
- Pinned notes feature in sidebar
- Quick actions bar for common tasks
- Modern UI with flat design and pill-shaped buttons

## Tech Stack

- Backend: Node.js with Express
- Database: SQLite
- Frontend: Vanilla JavaScript, HTML, CSS
- Charts: Chart.js for data visualization
- Authentication: JWT with bcryptjs

## Setup Instructions

### Prerequisites

- Node.js installed on your system
- npm package manager

### Installation Steps

1. Install dependencies

```
npm install
```

2. Update the JWT secret in .env file

Open the .env file and change the JWT_SECRET to a secure random string.

3. Start the server

```
npm start
```

The server will automatically seed the database with sample data on first run.

4. Open the application

Open your browser and go to http://localhost:3000

### Sample Login Credentials

The database is automatically seeded with sample users and 200 financial records. You can log in with any of these accounts:

Admin Accounts:
- Username: admin1, Password: admin123
- Username: admin2, Password: admin123

Analyst Accounts:
- Username: analyst1, Password: analyst123
- Username: analyst2, Password: analyst123

Viewer Account:
- Username: viewer1, Password: viewer123

All sample accounts have realistic financial data spanning the last 6 months with varied categories, amounts, and dates.

## Dashboard Features

The dashboard is designed to look and feel like a professional data analytics tool with the following components:

### Top Header
- Page title on the left
- Live date and time display in the center
- Search bar for quick transaction lookup
- Notification bell with badge counter
- User profile with name and role
- Logout button

### Sidebar Navigation
- App logo at the top
- Navigation menu with icons for Dashboard, Records, Analytics, Users, and Settings
- Active page highlighted with green accent
- Pinned notes section for quick memos
- User badge at the bottom showing avatar, name, and role

### Dashboard Main Content

#### Greeting and Health Summary
- Personalized greeting based on time of day
- Financial health summary in plain language
- Shows income trends and balance status

#### Alert Banner
- Appears when expenses exceed income
- Soft red background with warning icon
- Clear message about financial status

#### Quick Actions Bar
- Add Record button for quick transaction entry
- Export Data button for downloading records
- Filter by Month button for date-based filtering

#### Summary Stat Cards
- Total Income with percentage change and sparkline chart
- Total Expenses with percentage change and sparkline chart
- Net Balance with percentage change and sparkline chart
- Total Transactions count with sparkline chart
- Each card has colored left border accent
- Shows trend indicators and mini charts

#### This Week at a Glance
- 7 day boxes showing current week
- Green for days with positive balance
- Red for days with negative balance
- Grey for days with no transactions

#### Highlights
- Most Active Category chip showing top spending category
- Streak Counter showing consecutive days of transaction logging

#### Monthly Expense Goal
- Progress bar showing expense vs goal
- Changes color as it approaches limit
- Green for safe, orange for warning, red for danger

#### Charts and Visualizations
- Monthly Income vs Expenses bar chart for last 6 months
- Category Breakdown donut chart with legend
- Recent Transactions list with icons and amounts
- This Month vs Last Month comparison with arrows and percentages
- Top Categories horizontal bar chart
- Daily Cash Flow Trend line chart for current month

### Records Page
- Full data table with sortable columns
- Filter bar with date range, category, and type filters
- Pill-shaped filter chips for quick type selection
- Add Record button for creating new entries
- Edit and Delete actions for Admin users
- Alternating row colors for readability

### Analytics Page
- Large monthly trend line chart
- Category distribution pie chart
- Top spending categories list
- Month-wise summary table with income, expenses, balance, and savings rate

### Users Page (Admin Only)
- User management table
- Role badges with color coding
- Status badges showing active or inactive
- Activate and Deactivate buttons
- Add User functionality

### Settings Page
- Monthly expense goal configuration
- Save button to update goal
- Goal is used in dashboard progress bar

### Viewer

- Can view financial records
- Cannot create, update, or delete records
- Cannot view dashboard summaries or analytics

### Analyst

- Can view financial records
- Can create new records
- Can view dashboard summaries and analytics
- Cannot update or delete records
- Cannot manage users

### Admin

- Full access to all features
- Can create, update, and delete records
- Can view all summaries and analytics
- Can manage users and change their roles
- Can activate or deactivate user accounts

## API Endpoints

### Authentication

- POST /api/auth/register - Register a new user
  - Body: { username, password, role }
  - Roles: Viewer, Analyst, Admin

- POST /api/auth/login - Login user
  - Body: { username, password }
  - Returns: { token, user }

### Users (Admin only)

- GET /api/users - Get all users
  - Headers: Authorization: Bearer token

- PUT /api/users/:userId/role - Update user role
  - Headers: Authorization: Bearer token
  - Body: { role }

- PUT /api/users/:userId/status - Activate or deactivate user
  - Headers: Authorization: Bearer token
  - Body: { is_active }

### Financial Records

- GET /api/records - Get all records with optional filters
  - Headers: Authorization: Bearer token
  - Query params: startDate, endDate, category, type
  - Access: All authenticated users

- GET /api/records/:recordId - Get single record
  - Headers: Authorization: Bearer token
  - Access: All authenticated users

- POST /api/records - Create new record
  - Headers: Authorization: Bearer token
  - Body: { amount, type, category, date, notes }
  - Access: Analyst and Admin only

- PUT /api/records/:recordId - Update record
  - Headers: Authorization: Bearer token
  - Body: { amount, type, category, date, notes }
  - Access: Admin only

- DELETE /api/records/:recordId - Delete record
  - Headers: Authorization: Bearer token
  - Access: Admin only

### Dashboard (Analyst and Admin only)

- GET /api/dashboard/summary - Get total income, expense, and net balance
  - Headers: Authorization: Bearer token

- GET /api/dashboard/category-totals - Get category wise totals
  - Headers: Authorization: Bearer token

- GET /api/dashboard/recent - Get recent transactions
  - Headers: Authorization: Bearer token
  - Query params: limit (default 10)

- GET /api/dashboard/monthly-trends - Get monthly income and expense trends
  - Headers: Authorization: Bearer token

## Database Schema

### Users Table

- id: Primary key
- username: Unique username
- password: Hashed password
- role: User role (Viewer, Analyst, Admin)
- is_active: Account status (1 for active, 0 for inactive)
- created_at: Timestamp

### Financial Records Table

- id: Primary key
- amount: Transaction amount
- type: Transaction type (income or expense)
- category: Transaction category
- date: Transaction date
- notes: Optional notes
- created_by: User ID who created the record
- created_at: Timestamp

## Assumptions

- The application uses SQLite for simplicity and ease of setup
- JWT tokens expire after 24 hours
- All monetary amounts are stored as decimal numbers
- Date format is YYYY-MM-DD
- The frontend assumes the backend is running on localhost:3000
- User passwords are hashed using bcryptjs with 10 salt rounds
- Only Admin users can delete records to maintain data integrity
- The database file is created automatically on first run
- No pagination is implemented for simplicity
- All API responses return JSON format
- CORS is enabled for all origins for development purposes

## Project Structure

```
finance-dashboard/
- controllers/
  - authController.js - Authentication logic
  - userController.js - User management logic
  - recordController.js - Financial record logic
  - dashboardController.js - Dashboard and analytics logic
- middleware/
  - auth.js - JWT authentication and role checking
- routes/
  - authRoutes.js - Authentication routes
  - userRoutes.js - User management routes
  - recordRoutes.js - Financial record routes
  - dashboardRoutes.js - Dashboard routes
- public/
  - index.html - Main HTML file
  - styles.css - All CSS styles
  - app.js - Frontend JavaScript
- server.js - Main server file
- database.js - Database connection and initialization
- package.json - Project dependencies
- .env - Environment variables
- README.md - This file
```

## Color Palette

The UI uses a flat color scheme with no gradients:

- Rich Black: #00F81
- Dark Green: #032221
- Bangladesh Green: #03624C
- Mountain Meadow: #2CC295
- Caribbean Green: #00DF81
- Anti-Flash White: #F1F7F6
- Background: #E8F5EE

## Notes

- This is a student project built for learning purposes
- The code is intentionally simple and straightforward
- No advanced patterns or over-engineering
- Comments are added where logic needs explanation
- The UI is designed to look modern and professional like Tableau or Power BI
- All buttons are pill shaped with flat colors
- No shadows, gradients, or glassmorphism effects
- Chart.js is loaded from CDN for data visualizations
- Mock data is shown when no real data exists to keep dashboard looking filled
- The dashboard never looks empty, always displays sample data for better UX
- Pinned notes are saved in browser localStorage
- Expense goal is saved in browser localStorage
- Live clock updates every second in the header
- Week glance shows color-coded daily balance status
- All charts are responsive and interactive with hover tooltips
