# Matatu Sacco Manager

A comprehensive command-line fleet management system for Matatu Saccos in Kenya. Built with TypeScript/Node.js.

##  Project Overview

Matatu Sacco Manager helps Sacco administrators efficiently manage their fleet operations including:
- Vehicle fleet tracking
- Driver management and license monitoring
- Daily collection recording and analysis
- Expense tracking and profitability analysis
- Comprehensive reporting and data export

##  Features

### 1. Vehicle Management
- Add new vehicles with registration, capacity, route, and daily targets
- View all vehicles with assigned drivers
- Search vehicles by registration, route, or status
- Update vehicle details (route, target, status)
- Track vehicle status (active, inactive, maintenance)

### 2. Driver Management
- Register drivers with license information
- Assign drivers to specific vehicles
- Track license expiry dates with alerts
- View driver performance rankings
- Update driver contact and license details

### 3. Collections Management
- Record daily collections for each vehicle
- View collections by date with summary statistics
- Calculate daily, weekly, and monthly totals
- Performance rankings by vehicle
- Identify below-target collections
- Compare collections against daily targets

### 4. Expense Management
- Record expenses by category (fuel, repair, fine, insurance, other)
- View expenses by vehicle or category
- Calculate net profit (collections - expenses)
- Expense summary with statistical breakdowns
- Period-based financial analysis

### 5. Reports & Analytics
- Comprehensive fleet performance reports
- Route profitability analysis
- Top performer identification
- Alerts for expiring licenses
- Underperforming vehicle detection

### 6. Data Export
- Export all data to CSV format
- Custom exports with date range filtering
- Excel/Sheets compatible format

##  Technology Stack

- **TypeScript** - Type-safe programming
- **Node.js** - Runtime environment
- **readline-sync** - User input handling
- **File System (fs)** - Data persistence with JSON
- **CSV Export** - Data export functionality

##  Installation

1. **Clone or download the project**
```bash
cd matatu-sacco-manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the project**
```bash
npm run build
```

4. **Run the application**
```bash
npm start
```

##  Project Structure