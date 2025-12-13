import * as readlineSync from 'readline-sync';
import type{ Expense, ExpenseCategory } from './types.js';
import { 
  loadExpenses, 
  saveExpenses, 
  loadVehicles,
  loadCollections
} from './fileUtils.js';
import { 
  generateId, 
  formatCurrency,
  isValidDate,
  getTodayDate,
  findVehicleByRegistration,
  printHeader,
  printBorder,
  pause
} from './utils.js';

/**
 * Record a new expense
 */
export function recordExpense(): void {
  printHeader(' RECORD EXPENSE');
  
  const expenses = loadExpenses();
  const vehicles = loadVehicles();
  
  if (vehicles.length === 0) {
    console.log('\n No vehicles available. Add vehicles first.');
    pause();
    return;
  }
  
  // Get vehicle
  let vehicle;
  while (true) {
    const registration = readlineSync.question('\nVehicle Registration: ').trim();
    vehicle = findVehicleByRegistration(vehicles, registration);
    
    if (!vehicle) {
      console.log(` Vehicle ${registration} not found.`);
      const retry = readlineSync.question('Try again? (y/n): ').trim().toLowerCase();
      if (retry !== 'y' && retry !== 'yes') {
        return;
      }
      continue;
    }
    
    break;
  }
  
  // Display vehicle info
  console.log('\n Vehicle Details:');
  printBorder(50);
  console.log(`Registration: ${vehicle.registration}`);
  console.log(`Route: ${vehicle.route}`);
  printBorder(50);
  
  // Get expense category
  console.log('\n Expense Category:');
  console.log('1. Fuel');
  console.log('2. Repair');
  console.log('3. Fine');
  console.log('4. Insurance');
  console.log('5. Other');
  
  let category: ExpenseCategory = 'other';
  while (true) {
    const categoryChoice = readlineSync.question('\nSelect category: ').trim();
    
    switch (categoryChoice) {
      case '1':
        category = 'fuel';
        break;
      case '2':
        category = 'repair';
        break;
      case '3':
        category = 'fine';
        break;
      case '4':
        category = 'insurance';
        break;
      case '5':
        category = 'other';
        break;
      default:
        console.log(' Invalid option. Please try again.');
        continue;
    }
    
    break;
  }
  
  // Get description
  let description = '';
  while (true) {
    description = readlineSync.question('\nDescription (e.g., Diesel refill, Brake repair): ').trim();
    
    if (!description) {
      console.log(' Description cannot be empty.');
      continue;
    }
    
    if (description.length < 3) {
      console.log(' Description must be at least 3 characters.');
      continue;
    }
    
    break;
  }
  
  // Get amount
  let amount = 0;
  while (true) {
    const amountInput = readlineSync.question('Amount (KES): ').trim();
    amount = parseFloat(amountInput);
    
    if (isNaN(amount) || amount <= 0) {
      console.log(' Amount must be a positive number.');
      continue;
    }
    
    // Warn for large amounts
    if (amount > 50000) {
      const confirm = readlineSync.question(`  Large amount (${formatCurrency(amount)}). Confirm? (y/n): `).trim().toLowerCase();
      if (confirm !== 'y' && confirm !== 'yes') {
        continue;
      }
    }
    
    break;
  }
  
  // Get date
  let expenseDate = '';
  while (true) {
    const dateInput = readlineSync.question(`\nDate (YYYY-MM-DD) [${getTodayDate()}]: `).trim();
    expenseDate = dateInput || getTodayDate();
    
    if (!isValidDate(expenseDate)) {
      console.log(' Invalid date format. Use YYYY-MM-DD');
      continue;
    }
    
    break;
  }
  
  // Generate new ID
  const existingIds = expenses.map(e => e.id);
  const newId = generateId('e', existingIds);
  
  // Create new expense
  const newExpense: Expense = {
    id: newId,
    vehicleId: vehicle.id,
    category,
    description,
    amount,
    date: expenseDate
  };
  
  // Add to array and save
  expenses.push(newExpense);
  
  if (saveExpenses(expenses)) {
    console.log('\n Expense recorded successfully!');
    printBorder(50);
    console.log(`Vehicle: ${vehicle.registration}`);
    console.log(`Category: ${category.toUpperCase()}`);
    console.log(`Description: ${description}`);
    console.log(`Amount: ${formatCurrency(amount)}`);
    console.log(`Date: ${expenseDate}`);
    printBorder(50);
  } else {
    console.log(' Failed to save expense.');
  }
  
  pause();
}

/**
 * View expenses by vehicle
 */
export function viewExpensesByVehicle(): void {
  printHeader(' EXPENSES BY VEHICLE');
  
  const expenses = loadExpenses();
  const vehicles = loadVehicles();
  
  if (expenses.length === 0) {
    console.log('\n No expenses recorded yet.');
    pause();
    return;
  }
  
  // Get vehicle
  const registration = readlineSync.question('\nVehicle Registration: ').trim();
  const vehicle = findVehicleByRegistration(vehicles, registration);
  
  if (!vehicle) {
    console.log(` Vehicle ${registration} not found.`);
    pause();
    return;
  }
  
  // Filter expenses for this vehicle
  const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicle.id);
  
  if (vehicleExpenses.length === 0) {
    console.log(`\n📭 No expenses found for ${vehicle.registration}.`);
    pause();
    return;
  }
  
  // Sort by date (most recent first)
  vehicleExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  console.log(`\n Expenses for ${vehicle.registration} (${vehicle.route})`);
  console.log(`Total Entries: ${vehicleExpenses.length}\n`);
  
  let totalAmount = 0;
  
  vehicleExpenses.forEach((expense, index) => {
    console.log(`${index + 1}. [${expense.date}] ${expense.category.toUpperCase()}`);
    console.log(`   ${expense.description}`);
    console.log(`   Amount: ${formatCurrency(expense.amount)}`);
    console.log('');
    
    totalAmount += expense.amount;
  });
  
  printBorder(50);
  console.log(`Total Expenses: ${formatCurrency(totalAmount)}`);
  printBorder(50);
  
  pause();
}

/**
 * View expenses by category
 */
export function viewExpensesByCategory(): void {
  printHeader(' EXPENSES BY CATEGORY');
  
  const expenses = loadExpenses();
  
  if (expenses.length === 0) {
    console.log('\n No expenses recorded yet.');
    pause();
    return;
  }
  
  // Get category
  console.log('\nSelect Category:');
  console.log('1. Fuel');
  console.log('2. Repair');
  console.log('3. Fine');
  console.log('4. Insurance');
  console.log('5. Other');
  
  const categoryChoice = readlineSync.question('\nSelect option: ').trim();
  
  let category: ExpenseCategory;
  switch (categoryChoice) {
    case '1':
      category = 'fuel';
      break;
    case '2':
      category = 'repair';
      break;
    case '3':
      category = 'fine';
      break;
    case '4':
      category = 'insurance';
      break;
    case '5':
      category = 'other';
      break;
    default:
      console.log(' Invalid option.');
      pause();
      return;
  }
  
  // Filter expenses by category
  const categoryExpenses = expenses.filter(e => e.category === category);
  
  if (categoryExpenses.length === 0) {
    console.log(`\n No ${category} expenses found.`);
    pause();
    return;
  }
  
  // Sort by date (most recent first)
  categoryExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const vehicles = loadVehicles();
  
  console.log(`\n ${category.toUpperCase()} Expenses`);
  console.log(`Total Entries: ${categoryExpenses.length}\n`);
  
  let totalAmount = 0;
  
  categoryExpenses.forEach((expense, index) => {
    const vehicle = vehicles.find(v => v.id === expense.vehicleId);
    
    console.log(`${index + 1}. [${expense.date}] ${vehicle?.registration || 'Unknown'}`);
    console.log(`   ${expense.description}`);
    console.log(`   Amount: ${formatCurrency(expense.amount)}`);
    console.log('');
    
    totalAmount += expense.amount;
  });
  
  printBorder(50);
  console.log(`Total ${category.toUpperCase()} Expenses: ${formatCurrency(totalAmount)}`);
  printBorder(50);
  
  pause();
}

/**
 * Calculate net profit for a vehicle
 */
export function calculateNetProfit(): void {
  printHeader(' NET PROFIT CALCULATOR');
  
  const collections = loadCollections();
  const expenses = loadExpenses();
  const vehicles = loadVehicles();
  
  if (vehicles.length === 0) {
    console.log('\n No vehicles available.');
    pause();
    return;
  }
  
  // Get vehicle
  const registration = readlineSync.question('\nVehicle Registration: ').trim();
  const vehicle = findVehicleByRegistration(vehicles, registration);
  
  if (!vehicle) {
    console.log(` Vehicle ${registration} not found.`);
    pause();
    return;
  }
  
  // Get period
  console.log('\nSelect Period:');
  console.log('1. Last 7 days');
  console.log('2. Last 30 days');
  console.log('3. All time');
  console.log('4. Custom date range');
  
  const periodChoice = readlineSync.question('\nSelect option: ').trim();
  
  let startDate: Date;
  let endDate: Date = new Date();
  let periodLabel: string;
  
  switch (periodChoice) {
    case '1':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      periodLabel = 'Last 7 Days';
      break;
      
    case '2':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      periodLabel = 'Last 30 Days';
      break;
      
    case '3':
      startDate = new Date('2000-01-01');
      periodLabel = 'All Time';
      break;
      
    case '4':
      const startInput = readlineSync.question('Start date (YYYY-MM-DD): ').trim();
      const endInput = readlineSync.question('End date (YYYY-MM-DD): ').trim();
      
      if (!isValidDate(startInput) || !isValidDate(endInput)) {
        console.log(' Invalid date format.');
        pause();
        return;
      }
      
      startDate = new Date(startInput);
      endDate = new Date(endInput);
      periodLabel = `${startInput} to ${endInput}`;
      break;
      
    default:
      console.log(' Invalid option.');
      pause();
      return;
  }
  
  // Filter collections for this vehicle and period
  const vehicleCollections = collections.filter(c => {
    if (c.vehicleId !== vehicle.id) return false;
    const collectionDate = new Date(c.date);
    return collectionDate >= startDate && collectionDate <= endDate;
  });
  
  // Filter expenses for this vehicle and period
  const vehicleExpenses = expenses.filter(e => {
    if (e.vehicleId !== vehicle.id) return false;
    const expenseDate = new Date(e.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
  
  // Calculate totals
  const totalCollections = vehicleCollections.reduce((sum, c) => sum + c.amount, 0);
  const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalCollections - totalExpenses;
  
  // Calculate by category
  const expensesByCategory = {
    fuel: 0,
    repair: 0,
    fine: 0,
    insurance: 0,
    other: 0
  };
  
  vehicleExpenses.forEach(e => {
    expensesByCategory[e.category] += e.amount;
  });
  
  // Display results
  console.log(`\n Profit Analysis for ${vehicle.registration}`);
  console.log(`Period: ${periodLabel}\n`);
  
  printBorder(50);
  console.log('INCOME:');
  console.log(`  Collections: ${formatCurrency(totalCollections)}`);
  console.log(`  (${vehicleCollections.length} entries)`);
  console.log('');
  
  console.log('EXPENSES:');
  console.log(`  Fuel:      ${formatCurrency(expensesByCategory.fuel)}`);
  console.log(`  Repairs:   ${formatCurrency(expensesByCategory.repair)}`);
  console.log(`  Fines:     ${formatCurrency(expensesByCategory.fine)}`);
  console.log(`  Insurance: ${formatCurrency(expensesByCategory.insurance)}`);
  console.log(`  Other:     ${formatCurrency(expensesByCategory.other)}`);
  console.log(`  ────────────────────────────`);
  console.log(`  Total:     ${formatCurrency(totalExpenses)}`);
  console.log(`  (${vehicleExpenses.length} entries)`);
  console.log('');
  
  printBorder(50);
  if (netProfit >= 0) {
    console.log(`NET PROFIT: ${formatCurrency(netProfit)} `);
  } else {
    console.log(`NET LOSS: ${formatCurrency(Math.abs(netProfit))} `);
  }
  printBorder(50);
  
  // Additional metrics
  if (vehicleCollections.length > 0) {
    const avgDailyCollection = totalCollections / vehicleCollections.length;
    const avgDailyExpense = totalExpenses / vehicleCollections.length;
    const profitMargin = (netProfit / totalCollections) * 100;
    
    console.log('\nMETRICS:');
    console.log(`  Avg Daily Collection: ${formatCurrency(avgDailyCollection)}`);
    console.log(`  Avg Daily Expense: ${formatCurrency(avgDailyExpense)}`);
    console.log(`  Profit Margin: ${profitMargin.toFixed(1)}%`);
  }
  
  pause();
}

/**
 * Generate expense summary by category
 */
export function generateExpenseSummary(): void {
  printHeader(' EXPENSE SUMMARY');
  
  const expenses = loadExpenses();
  
  if (expenses.length === 0) {
    console.log('\n No expenses recorded yet.');
    pause();
    return;
  }
  
  // Get period
  console.log('\nSelect Period:');
  console.log('1. Last 7 days');
  console.log('2. Last 30 days');
  console.log('3. All time');
  
  const periodChoice = readlineSync.question('\nSelect option: ').trim();
  
  let startDate: Date;
  let endDate: Date = new Date();
  let periodLabel: string;
  
  switch (periodChoice) {
    case '1':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      periodLabel = 'Last 7 Days';
      break;
      
    case '2':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      periodLabel = 'Last 30 Days';
      break;
      
    case '3':
      startDate = new Date('2000-01-01');
      periodLabel = 'All Time';
      break;
      
    default:
      console.log(' Invalid option.');
      pause();
      return;
  }
  
  // Filter expenses by period
  const periodExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
  
  if (periodExpenses.length === 0) {
    console.log(`\n📭 No expenses found for ${periodLabel}.`);
    pause();
    return;
  }
  
  // Calculate by category
  const categoryTotals = {
    fuel: 0,
    repair: 0,
    fine: 0,
    insurance: 0,
    other: 0
  };
  
  const categoryCounts = {
    fuel: 0,
    repair: 0,
    fine: 0,
    insurance: 0,
    other: 0
  };
  
  periodExpenses.forEach(e => {
    categoryTotals[e.category] += e.amount;
    categoryCounts[e.category]++;
  });
  
  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  
  console.log(`\n Expense Summary - ${periodLabel}\n`);
  
  printBorder(60);
  console.log('Category      Count    Total           % of Total   Avg');
  printBorder(60);
  
  const categories: ExpenseCategory[] = ['fuel', 'repair', 'fine', 'insurance', 'other'];
  
  categories.forEach(category => {
    const count = categoryCounts[category];
    const total = categoryTotals[category];
    const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
    const average = count > 0 ? total / count : 0;
    
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1).padEnd(12);
    const countStr = count.toString().padEnd(8);
    const totalStr = formatCurrency(total).padEnd(15);
    const percentStr = `${percentage.toFixed(1)}%`.padEnd(12);
    const avgStr = formatCurrency(average);
    
    console.log(`${categoryName} ${countStr} ${totalStr} ${percentStr} ${avgStr}`);
  });
  
  printBorder(60);
  console.log(`TOTAL         ${periodExpenses.length}       ${formatCurrency(totalExpenses)}`);
  printBorder(60);
  
  pause();
}

/**
 * View all expenses
 */
export function viewAllExpenses(): void {
  printHeader(' ALL EXPENSES');
  
  const expenses = loadExpenses();
  const vehicles = loadVehicles();
  
  if (expenses.length === 0) {
    console.log('\n No expenses recorded yet.');
    pause();
    return;
  }
  
  // Sort by date (most recent first)
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  console.log(`\nTotal Expenses: ${expenses.length}\n`);
  
  // Show last 20 expenses
  const displayCount = Math.min(20, sortedExpenses.length);
  console.log(`Showing most recent ${displayCount} expenses:\n`);
  
  sortedExpenses.slice(0, displayCount).forEach((expense, index) => {
    const vehicle = vehicles.find(v => v.id === expense.vehicleId);
    
    console.log(`${index + 1}. [${expense.date}] ${expense.category.toUpperCase()}`);
    console.log(`   Vehicle: ${vehicle?.registration || 'Unknown'}`);
    console.log(`   ${expense.description}`);
    console.log(`   Amount: ${formatCurrency(expense.amount)}`);
    console.log('');
  });
  
  if (expenses.length > 20) {
    console.log(`... and ${expenses.length - 20} more expenses`);
  }
  
  pause();
}

/**
 * Expense Management submenu
 */
export function expenseManagementMenu(): void {
  let running = true;
  
  while (running) {
    printHeader(' EXPENSE MANAGEMENT');
    
    console.log('1. Record Expense');
    console.log('2. View Expenses by Vehicle');
    console.log('3. View Expenses by Category');
    console.log('4. Calculate Net Profit');
    console.log('5. Expense Summary by Category');
    console.log('6. View All Expenses');
    console.log('7. Back to Main Menu');
    printBorder(50);
    
    const choice = readlineSync.question('\nSelect option: ').trim();
    
    switch (choice) {
      case '1':
        recordExpense();
        break;
      case '2':
        viewExpensesByVehicle();
        break;
      case '3':
        viewExpensesByCategory();
        break;
      case '4':
        calculateNetProfit();
        break;
      case '5':
        generateExpenseSummary();
        break;
      case '6':
        viewAllExpenses();
        break;
      case '7':
        running = false;
        break;
      default:
        console.log(' Invalid option. Please try again.');
        pause();
    }
  }
}