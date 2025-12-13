import * as readlineSync from 'readline-sync';
import { 
  loadVehicles, 
  loadDrivers, 
  loadCollections, 
  loadExpenses,
  exportVehiclesToCSV,
  exportCollectionsToCSV,
  exportExpensesToCSV
} from './fileUtils.js';
import { 
  formatCurrency,
  getTodayDate,
  printHeader,
  printBorder,
  pause
} from './utils.js';

/**
 * Generate comprehensive fleet performance summary
 */
export function generateFleetPerformanceReport(): void {
  printHeader(' FLEET PERFORMANCE REPORT');
  
  const vehicles = loadVehicles();
  const drivers = loadDrivers();
  const collections = loadCollections();
  const expenses = loadExpenses();
  
  if (vehicles.length === 0) {
    console.log('\n No data available for report generation.');
    pause();
    return;
  }
  
  console.log(`\nReport Generated: ${getTodayDate()}\n`);
  
  // ========================================
  // SECTION 1: FLEET OVERVIEW
  // ========================================
  printBorder(60);
  console.log('FLEET OVERVIEW');
  printBorder(60);
  
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'inactive').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  
  console.log(`Total Vehicles: ${vehicles.length}`);
  console.log(`  Active: ${activeVehicles}`);
  console.log(`  Inactive: ${inactiveVehicles}`);
  console.log(`  Under Maintenance: ${maintenanceVehicles}`);
  console.log(`\nTotal Drivers: ${drivers.length}`);
  
  const assignedDrivers = drivers.filter(d => d.assignedVehicleId !== null).length;
  console.log(`  Assigned: ${assignedDrivers}`);
  console.log(`  Unassigned: ${drivers.length - assignedDrivers}`);
  
  // ========================================
  // SECTION 2: FINANCIAL SUMMARY
  // ========================================
  console.log('\n');
  printBorder(60);
  console.log('FINANCIAL SUMMARY');
  printBorder(60);
  
  const totalCollections = collections.reduce((sum, c) => sum + c.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalCollections - totalExpenses;
  
  console.log(`Total Collections: ${formatCurrency(totalCollections)}`);
  console.log(`  (${collections.length} entries)`);
  console.log(`\nTotal Expenses: ${formatCurrency(totalExpenses)}`);
  console.log(`  (${expenses.length} entries)`);
  
  // Expense breakdown
  const expenseBreakdown = {
    fuel: 0,
    repair: 0,
    fine: 0,
    insurance: 0,
    other: 0
  };
  
  expenses.forEach(e => {
    expenseBreakdown[e.category] += e.amount;
  });
  
  console.log('\nExpense Breakdown:');
  console.log(`  Fuel:      ${formatCurrency(expenseBreakdown.fuel)}`);
  console.log(`  Repairs:   ${formatCurrency(expenseBreakdown.repair)}`);
  console.log(`  Fines:     ${formatCurrency(expenseBreakdown.fine)}`);
  console.log(`  Insurance: ${formatCurrency(expenseBreakdown.insurance)}`);
  console.log(`  Other:     ${formatCurrency(expenseBreakdown.other)}`);
  
  console.log('\n');
  printBorder(60);
  if (netProfit >= 0) {
    console.log(`NET PROFIT: ${formatCurrency(netProfit)} `);
  } else {
    console.log(`NET LOSS: ${formatCurrency(Math.abs(netProfit))} `);
  }
  
  if (totalCollections > 0) {
    const profitMargin = (netProfit / totalCollections) * 100;
    console.log(`Profit Margin: ${profitMargin.toFixed(1)}%`);
  }
  printBorder(60);
  
  // ========================================
  // SECTION 3: VEHICLE PERFORMANCE
  // ========================================
  console.log('\n');
  printBorder(60);
  console.log('TOP 5 PERFORMING VEHICLES');
  printBorder(60);
  
  const vehiclePerformance = vehicles.map(vehicle => {
    const vehicleCollections = collections.filter(c => c.vehicleId === vehicle.id);
    const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicle.id);
    
    if (vehicleCollections.length === 0) {
      return {
        vehicle,
        totalCollections: 0,
        totalExpenses: 0,
        netProfit: 0,
        averageDaily: 0,
        targetAchievement: 0,
        collectionCount: 0
      };
    }
    
    const totalCollections = vehicleCollections.reduce((sum, c) => sum + c.amount, 0);
    const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalCollections - totalExpenses;
    const averageDaily = totalCollections / vehicleCollections.length;
    const targetAchievement = (averageDaily / vehicle.dailyTarget) * 100;
    
    return {
      vehicle,
      totalCollections,
      totalExpenses,
      netProfit,
      averageDaily,
      targetAchievement,
      collectionCount: vehicleCollections.length
    };
  });
  
  // Sort by net profit (descending)
  vehiclePerformance.sort((a, b) => b.netProfit - a.netProfit);
  
  vehiclePerformance.slice(0, 5).forEach((perf, index) => {
    if (perf.collectionCount === 0) return;
    
    console.log(`\n${index + 1}. ${perf.vehicle.registration} (${perf.vehicle.route})`);
    console.log(`   Collections: ${formatCurrency(perf.totalCollections)} (${perf.collectionCount} days)`);
    console.log(`   Expenses: ${formatCurrency(perf.totalExpenses)}`);
    console.log(`   Net Profit: ${formatCurrency(perf.netProfit)}`);
    console.log(`   Avg Daily: ${formatCurrency(perf.averageDaily)} (${perf.targetAchievement.toFixed(1)}% of target)`);
  });
  
  // ========================================
  // SECTION 4: DRIVER PERFORMANCE
  // ========================================
  console.log('\n');
  printBorder(60);
  console.log('TOP 5 PERFORMING DRIVERS');
  printBorder(60);
  
  const driverPerformance = drivers.map(driver => {
    const driverCollections = collections.filter(c => c.driverId === driver.id);
    
    if (driverCollections.length === 0) {
      return {
        driver,
        totalCollections: 0,
        averageDaily: 0,
        collectionCount: 0
      };
    }
    
    const totalCollections = driverCollections.reduce((sum, c) => sum + c.amount, 0);
    const averageDaily = totalCollections / driverCollections.length;
    
    return {
      driver,
      totalCollections,
      averageDaily,
      collectionCount: driverCollections.length
    };
  });
  
  // Sort by average daily (descending)
  driverPerformance.sort((a, b) => b.averageDaily - a.averageDaily);
  
  driverPerformance.slice(0, 5).forEach((perf, index) => {
    if (perf.collectionCount === 0) return;
    
    const vehicle = vehicles.find(v => v.id === perf.driver.assignedVehicleId);
    
    console.log(`\n${index + 1}. ${perf.driver.name}`);
    console.log(`   Vehicle: ${vehicle ? vehicle.registration : 'Not assigned'}`);
    console.log(`   Total: ${formatCurrency(perf.totalCollections)} (${perf.collectionCount} days)`);
    console.log(`   Avg Daily: ${formatCurrency(perf.averageDaily)}`);
  });
  
  // ========================================
  // SECTION 5: ALERTS & RECOMMENDATIONS
  // ========================================
  console.log('\n');
  printBorder(60);
  console.log('ALERTS & RECOMMENDATIONS');
  printBorder(60);
  
  // Check for expiring licenses
  const expiringLicenses = drivers.filter(d => {
    const expiryDate = new Date(d.licenseExpiry);
    const today = new Date();
    const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 30;
  });
  
  if (expiringLicenses.length > 0) {
    console.log(`\n⚠️  ${expiringLicenses.length} driver license(s) expiring within 30 days:`);
    expiringLicenses.forEach(driver => {
      const expiryDate = new Date(driver.licenseExpiry);
      const today = new Date();
      const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   - ${driver.name} (expires in ${daysUntil} days)`);
    });
  }
  
  // Check for unassigned vehicles
  const unassignedVehicles = vehicles.filter(v => v.assignedDriverId === null && v.status === 'active');
  if (unassignedVehicles.length > 0) {
    console.log(`\n ${unassignedVehicles.length} active vehicle(s) without assigned drivers:`);
    unassignedVehicles.forEach(vehicle => {
      console.log(`   - ${vehicle.registration} (${vehicle.route})`);
    });
  }
  
  // Check for vehicles under maintenance
  if (maintenanceVehicles > 0) {
    console.log(`\n🔧 ${maintenanceVehicles} vehicle(s) currently under maintenance:`);
    vehicles.filter(v => v.status === 'maintenance').forEach(vehicle => {
      console.log(`   - ${vehicle.registration} (${vehicle.route})`);
    });
  }
  
  // Check for underperforming vehicles
  const underperforming = vehiclePerformance.filter(p => 
    p.collectionCount > 0 && p.targetAchievement < 80
  );
  
  if (underperforming.length > 0) {
    console.log(`\n ${underperforming.length} vehicle(s) consistently below target (< 80%):`);
    underperforming.forEach(perf => {
      console.log(`   - ${perf.vehicle.registration}: ${perf.targetAchievement.toFixed(1)}% of target`);
    });
  }
  
  if (expiringLicenses.length === 0 && unassignedVehicles.length === 0 && 
      maintenanceVehicles === 0 && underperforming.length === 0) {
    console.log('\n No alerts at this time. Fleet is operating smoothly!');
  }
  
  console.log('\n');
  printBorder(60);
  console.log('END OF REPORT');
  printBorder(60);
  
  pause();
}

/**
 * Generate route profitability analysis (BONUS)
 */
export function generateRouteProfitabilityReport(): void {
  printHeader(' ROUTE PROFITABILITY ANALYSIS');
  
  const vehicles = loadVehicles();
  const collections = loadCollections();
  const expenses = loadExpenses();
  
  if (collections.length === 0) {
    console.log('\n No data available for route analysis.');
    pause();
    return;
  }
  
  // Group vehicles by route
  const routeData: { [route: string]: {
    vehicles: typeof vehicles,
    totalCollections: number,
    totalExpenses: number,
    collectionCount: number
  }} = {};
  
  vehicles.forEach(vehicle => {
    if (!routeData[vehicle.route]) {
      routeData[vehicle.route] = {
        vehicles: [],
        totalCollections: 0,
        totalExpenses: 0,
        collectionCount: 0
      };
    }
    
    routeData[vehicle.route]!.vehicles.push(vehicle);
    
    // Calculate collections for this vehicle
    const vehicleCollections = collections.filter(c => c.vehicleId === vehicle.id);
    const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicle.id);
    
    routeData[vehicle.route]!.totalCollections += vehicleCollections.reduce((sum, c) => sum + c.amount, 0);
    routeData[vehicle.route]!.totalExpenses += vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    routeData[vehicle.route]!.collectionCount += vehicleCollections.length;
  });
  
  // Calculate profitability for each route
  const routeProfitability = Object.entries(routeData).map(([route, data]) => {
    const netProfit = data.totalCollections - data.totalExpenses;
    const profitMargin = data.totalCollections > 0 ? (netProfit / data.totalCollections) * 100 : 0;
    const avgDailyPerVehicle = data.collectionCount > 0 ? data.totalCollections / data.collectionCount : 0;
    
    return {
      route,
      vehicleCount: data.vehicles.length,
      totalCollections: data.totalCollections,
      totalExpenses: data.totalExpenses,
      netProfit,
      profitMargin,
      avgDailyPerVehicle,
      collectionCount: data.collectionCount
    };
  });
  
  // Sort by net profit (descending)
  routeProfitability.sort((a, b) => b.netProfit - a.netProfit);
  
  console.log('\n Route Rankings by Profitability:\n');
  
  routeProfitability.forEach((route, index) => {
    console.log(`${index + 1}. ${route.route}`);
    console.log(`   Vehicles: ${route.vehicleCount}`);
    console.log(`   Collections: ${formatCurrency(route.totalCollections)} (${route.collectionCount} days)`);
    console.log(`   Expenses: ${formatCurrency(route.totalExpenses)}`);
    console.log(`   Net Profit: ${formatCurrency(route.netProfit)}`);
    console.log(`   Profit Margin: ${route.profitMargin.toFixed(1)}%`);
    console.log(`   Avg Daily/Vehicle: ${formatCurrency(route.avgDailyPerVehicle)}`);
    console.log('');
  });
  
  pause();
}

/**
 * Export all data to CSV files
 */
export function exportAllData(): void {
  printHeader(' EXPORT DATA TO CSV');
  
  const vehicles = loadVehicles();
  const drivers = loadDrivers();
  const collections = loadCollections();
  const expenses = loadExpenses();
  
  console.log('\nExporting data to CSV files...\n');
  
  let successCount = 0;
  
  // Export vehicles
  if (exportVehiclesToCSV(vehicles)) {
    console.log(' Vehicles exported');
    successCount++;
  } else {
    console.log(' Failed to export vehicles');
  }
  
  // Export collections
  if (exportCollectionsToCSV(collections, vehicles, drivers)) {
    console.log(' Collections exported');
    successCount++;
  } else {
    console.log(' Failed to export collections');
  }
  
  // Export expenses
  if (exportExpensesToCSV(expenses, vehicles)) {
    console.log(' Expenses exported');
    successCount++;
  } else {
    console.log(' Failed to export expenses');
  }
  
  console.log('\n');
  printBorder(50);
  console.log(`Export Complete: ${successCount}/3 files exported successfully`);
  console.log('Files saved to: data/ directory');
  console.log('  - vehicles_export.csv');
  console.log('  - collections_export.csv');
  console.log('  - expenses_export.csv');
  printBorder(50);
  
  pause();
}

/**
 * Custom CSV export with date range
 */
export function exportCustomData(): void {
  printHeader(' CUSTOM DATA EXPORT');
  
  console.log('\nSelect data to export:');
  console.log('1. Collections (with date range)');
  console.log('2. Expenses (with date range)');
  console.log('3. Cancel');
  
  const choice = readlineSync.question('\nSelect option: ').trim();
  
  if (choice === '3') {
    return;
  }
  
  // Get date range
  console.log('\nDate Range:');
  const startInput = readlineSync.question('Start date (YYYY-MM-DD) [leave empty for all]: ').trim();
  const endInput = readlineSync.question('End date (YYYY-MM-DD) [leave empty for all]: ').trim();
  
  const vehicles = loadVehicles();
  const drivers = loadDrivers();
  
  if (choice === '1') {
    // Export collections
    let collections = loadCollections();
    
    // Filter by date range if provided
    if (startInput) {
      const startDate = new Date(startInput);
      collections = collections.filter(c => new Date(c.date) >= startDate);
    }
    
    if (endInput) {
      const endDate = new Date(endInput);
      collections = collections.filter(c => new Date(c.date) <= endDate);
    }
    
    const filename = `collections_${startInput || 'all'}_to_${endInput || 'all'}.csv`;
    
    if (exportCollectionsToCSV(collections, vehicles, drivers, filename)) {
      console.log(`\n Exported ${collections.length} collections to: data/${filename}`);
    } else {
      console.log('\n Export failed');
    }
    
  } else if (choice === '2') {
    // Export expenses
    let expenses = loadExpenses();
    
    // Filter by date range if provided
    if (startInput) {
      const startDate = new Date(startInput);
      expenses = expenses.filter(e => new Date(e.date) >= startDate);
    }
    
    if (endInput) {
      const endDate = new Date(endInput);
      expenses = expenses.filter(e => new Date(e.date) <= endDate);
    }
    
    const filename = `expenses_${startInput || 'all'}_to_${endInput || 'all'}.csv`;
    
    if (exportExpensesToCSV(expenses, vehicles, filename)) {
      console.log(`\n Exported ${expenses.length} expenses to: data/${filename}`);
    } else {
      console.log('\n Export failed');
    }
  }
  
  pause();
}

/**
 * Reports submenu
 */
export function reportsMenu(): void {
  let running = true;
  
  while (running) {
    printHeader(' REPORTS & ANALYTICS');
    
    console.log('1. Fleet Performance Report');
    console.log('2. Route Profitability Analysis');
    console.log('3. Back to Main Menu');
    printBorder(50);
    
    const choice = readlineSync.question('\nSelect option: ').trim();
    
    switch (choice) {
      case '1':
        generateFleetPerformanceReport();
        break;
      case '2':
        generateRouteProfitabilityReport();
        break;
      case '3':
        running = false;
        break;
      default:
        console.log(' Invalid option. Please try again.');
        pause();
    }
  }
}

/**
 * Export submenu
 */
export function exportMenu(): void {
  let running = true;
  
  while (running) {
    printHeader(' EXPORT DATA');
    
    console.log('1. Export All Data (Quick Export)');
    console.log('2. Custom Export (With Date Range)');
    console.log('3. Back to Main Menu');
    printBorder(50);
    
    const choice = readlineSync.question('\nSelect option: ').trim();
    
    switch (choice) {
      case '1':
        exportAllData();
        break;
      case '2':
        exportCustomData();
        break;
      case '3':
        running = false;
        break;
      default:
        console.log('Invalid option. Please try again.');
        pause();
    }
  }
}