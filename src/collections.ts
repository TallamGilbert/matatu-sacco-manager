import * as readlineSync from 'readline-sync';
import type { Collection } from './types.js';
import { 
  loadCollections, 
  saveCollections, 
  loadVehicles, 
  loadDrivers 
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
 * Record a daily collection
 */
export function recordCollection(): void {
  printHeader(' RECORD DAILY COLLECTION');
  
  const collections = loadCollections();
  const vehicles = loadVehicles();
  const drivers = loadDrivers();
  
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
  
  // Check if vehicle has an assigned driver
  const assignedDriver = drivers.find(d => d.id === vehicle.assignedDriverId);
  
  if (!assignedDriver) {
    console.log('\n  Warning: This vehicle has no assigned driver.');
    const proceed = readlineSync.question('Continue anyway? (y/n): ').trim().toLowerCase();
    if (proceed !== 'y' && proceed !== 'yes') {
      return;
    }
  }
  
  // Display vehicle info
  console.log('\n Vehicle Details:');
  printBorder(50);
  console.log(`Registration: ${vehicle.registration}`);
  console.log(`Route: ${vehicle.route}`);
  console.log(`Daily Target: ${formatCurrency(vehicle.dailyTarget)}`);
  console.log(`Driver: ${assignedDriver ? assignedDriver.name : 'Not assigned'}`);
  printBorder(50);
  
  // Get date
  let collectionDate = '';
  while (true) {
    const dateInput = readlineSync.question(`\nDate (YYYY-MM-DD) [${getTodayDate()}]: `).trim();
    collectionDate = dateInput || getTodayDate();
    
    if (!isValidDate(collectionDate)) {
      console.log(' Invalid date format. Use YYYY-MM-DD');
      continue;
    }
    
    // Check if collection already exists for this vehicle on this date
    const existingCollection = collections.find(
      c => c.vehicleId === vehicle.id && c.date === collectionDate
    );
    
    if (existingCollection) {
      console.log(`  A collection already exists for ${vehicle.registration} on ${collectionDate}`);
      console.log(`   Amount: ${formatCurrency(existingCollection.amount)}`);
      const overwrite = readlineSync.question('Overwrite existing collection? (y/n): ').trim().toLowerCase();
      
      if (overwrite === 'y' || overwrite === 'yes') {
        // Remove existing collection
        const index = collections.indexOf(existingCollection);
        collections.splice(index, 1);
        break;
      } else {
        return;
      }
    }
    
    break;
  }
  
  // Get amount
  let amount = 0;
  while (true) {
    const amountInput = readlineSync.question('Amount Collected (KES): ').trim();
    amount = parseFloat(amountInput);
    
    if (isNaN(amount) || amount < 0) {
      console.log(' Amount must be a positive number.');
      continue;
    }
    
    if (amount === 0) {
      const confirm = readlineSync.question('  Amount is zero. Confirm? (y/n): ').trim().toLowerCase();
      if (confirm !== 'y' && confirm !== 'yes') {
        continue;
      }
    }
    
    break;
  }
  
  // Determine which driver to use
  let driverId: string;
  
  if (assignedDriver) {
    // Use assigned driver
    driverId = assignedDriver.id;
  } else {
    // Ask user to select a driver
    console.log('\n Select driver:');
    drivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name}`);
    });
    console.log(`${drivers.length + 1}. Skip (no driver)`);
    
    const driverChoice = readlineSync.question('\nSelect option: ').trim();
    const driverIndex = parseInt(driverChoice) - 1;
    
    if (driverIndex >= 0 && driverIndex < drivers.length) {
      driverId = drivers[driverIndex]!.id;
    } else {
      console.log('  Collection will be recorded without a driver.');
      driverId = 'unassigned';
    }
  }
  
  // Generate new ID
  const existingIds = collections.map(c => c.id);
  const newId = generateId('c', existingIds);
  
  // Create new collection
  const newCollection: Collection = {
    id: newId,
    vehicleId: vehicle.id,
    driverId,
    date: collectionDate,
    amount
  };
  
  // Add to array and save
  collections.push(newCollection);
  
  if (saveCollections(collections)) {
    console.log('\n Collection recorded successfully!');
    printBorder(50);
    console.log(`Vehicle: ${vehicle.registration} (${vehicle.route})`);
    console.log(`Driver: ${assignedDriver ? assignedDriver.name : 'Unassigned'}`);
    console.log(`Date: ${collectionDate}`);
    console.log(`Amount: ${formatCurrency(amount)}`);
    console.log(`Target: ${formatCurrency(vehicle.dailyTarget)}`);
    
    // Calculate performance
    const difference = amount - vehicle.dailyTarget;
    if (difference > 0) {
      console.log(`Status:  Above target by ${formatCurrency(difference)}`);
    } else if (difference < 0) {
      console.log(`Status:   Below target by ${formatCurrency(Math.abs(difference))}`);
    } else {
      console.log(`Status:  Target met exactly!`);
    }
    
    printBorder(50);
  } else {
    console.log(' Failed to save collection.');
  }
  
  pause();
}

/**
 * View collections for a specific date
 */
export function viewCollectionsByDate(): void {
  printHeader(' VIEW COLLECTIONS BY DATE');
  
  const collections = loadCollections();
  const vehicles = loadVehicles();
  const drivers = loadDrivers();
  
  if (collections.length === 0) {
    console.log('\n No collections recorded yet.');
    pause();
    return;
  }
  
  // Get date
  const dateInput = readlineSync.question(`\nEnter date (YYYY-MM-DD) [${getTodayDate()}]: `).trim();
  const searchDate = dateInput || getTodayDate();
  
  if (!isValidDate(searchDate)) {
    console.log(' Invalid date format.');
    pause();
    return;
  }
  
  // Filter collections by date
  const dateCollections = collections.filter(c => c.date === searchDate);
  
  if (dateCollections.length === 0) {
    console.log(`\n No collections found for ${searchDate}.`);
    pause();
    return;
  }
  
  console.log(`\n Collections for ${searchDate}`);
  console.log(`Total Entries: ${dateCollections.length}\n`);
  
  let totalAmount = 0;
  let totalTarget = 0;
  
  dateCollections.forEach((collection, index) => {
    const vehicle = vehicles.find(v => v.id === collection.vehicleId);
    const driver = drivers.find(d => d.id === collection.driverId);
    
    console.log(`${index + 1}. ${vehicle?.registration || 'Unknown'}`);
    console.log(`   Route: ${vehicle?.route || 'Unknown'}`);
    console.log(`   Driver: ${driver?.name || 'Unassigned'}`);
    console.log(`   Amount: ${formatCurrency(collection.amount)}`);
    console.log(`   Target: ${formatCurrency(vehicle?.dailyTarget || 0)}`);
    
    if (vehicle) {
      const difference = collection.amount - vehicle.dailyTarget;
      if (difference >= 0) {
        console.log(`   Status:  +${formatCurrency(difference)}`);
      } else {
        console.log(`   Status:   ${formatCurrency(difference)}`);
      }
      
      totalTarget += vehicle.dailyTarget;
    }
    
    totalAmount += collection.amount;
    console.log('');
  });
  
  // Summary
  printBorder(50);
  console.log(`Total Collected: ${formatCurrency(totalAmount)}`);
  console.log(`Total Target: ${formatCurrency(totalTarget)}`);
  console.log(`Difference: ${formatCurrency(totalAmount - totalTarget)}`);
  console.log(`Achievement: ${totalTarget > 0 ? ((totalAmount / totalTarget) * 100).toFixed(1) : 0}%`);
  printBorder(50);
  
  pause();
}

/**
 * View all collections
 */
export function viewAllCollections(): void {
  printHeader(' ALL COLLECTIONS');
  
  const collections = loadCollections();
  const vehicles = loadVehicles();
  const drivers = loadDrivers();
  
  if (collections.length === 0) {
    console.log('\n No collections recorded yet.');
    pause();
    return;
  }
  
  console.log(`\nTotal Collections: ${collections.length}\n`);
  
  // Sort by date (most recent first)
  const sortedCollections = [...collections].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Show last 20 collections
  const displayCount = Math.min(20, sortedCollections.length);
  console.log(`Showing most recent ${displayCount} collections:\n`);
  
  sortedCollections.slice(0, displayCount).forEach((collection, index) => {
    const vehicle = vehicles.find(v => v.id === collection.vehicleId);
    const driver = drivers.find(d => d.id === collection.driverId);
    
    console.log(`${index + 1}. [${collection.date}] ${vehicle?.registration || 'Unknown'}`);
    console.log(`   Driver: ${driver?.name || 'Unassigned'}`);
    console.log(`   Amount: ${formatCurrency(collection.amount)}`);
    console.log('');
  });
  
  if (collections.length > 20) {
    console.log(`... and ${collections.length - 20} more collections`);
  }
  
  pause();
}

/**
 * Calculate total collections for a period
 */
export function calculatePeriodTotals(): void {
  printHeader(' PERIOD TOTALS');
  
  const collections = loadCollections();
  
  if (collections.length === 0) {
    console.log('\n No collections recorded yet.');
    pause();
    return;
  }
  
  console.log('\nSelect period:');
  console.log('1. Today');
  console.log('2. Last 7 days (Weekly)');
  console.log('3. Last 30 days (Monthly)');
  console.log('4. Custom date range');
  
  const choice = readlineSync.question('\nSelect option: ').trim();
  
  let startDate: Date;
  let endDate: Date = new Date();
  let periodLabel: string;
  
  switch (choice) {
    case '1':
      startDate = new Date();
      periodLabel = 'Today';
      break;
      
    case '2':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      periodLabel = 'Last 7 Days';
      break;
      
    case '3':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      periodLabel = 'Last 30 Days';
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
  
  // Filter collections within date range
  const periodCollections = collections.filter(c => {
    const collectionDate = new Date(c.date);
    return collectionDate >= startDate && collectionDate <= endDate;
  });
  
  if (periodCollections.length === 0) {
    console.log(`\n📭 No collections found for ${periodLabel}.`);
    pause();
    return;
  }
  
  // Calculate totals
  const totalAmount = periodCollections.reduce((sum, c) => sum + c.amount, 0);
  const averageAmount = totalAmount / periodCollections.length;
  
  console.log(`\n ${periodLabel} Summary`);
  printBorder(50);
  console.log(`Total Collections: ${periodCollections.length} entries`);
  console.log(`Total Amount: ${formatCurrency(totalAmount)}`);
  console.log(`Average per Collection: ${formatCurrency(averageAmount)}`);
  printBorder(50);
  
  pause();
}

/**
 * Identify top and bottom performing vehicles
 */
export function viewPerformanceRankings(): void {
  printHeader(' VEHICLE PERFORMANCE RANKINGS');
  
  const collections = loadCollections();
  const vehicles = loadVehicles();
  
  if (collections.length === 0) {
    console.log('\n No collections data available.');
    pause();
    return;
  }
  
  // Calculate performance for each vehicle
  const performance = vehicles.map(vehicle => {
    const vehicleCollections = collections.filter(c => c.vehicleId === vehicle.id);
    
    if (vehicleCollections.length === 0) {
      return {
        vehicle,
        totalCollections: 0,
        totalAmount: 0,
        averageAmount: 0,
        percentOfTarget: 0
      };
    }
    
    const totalAmount = vehicleCollections.reduce((sum, c) => sum + c.amount, 0);
    const averageAmount = totalAmount / vehicleCollections.length;
    const percentOfTarget = (averageAmount / vehicle.dailyTarget) * 100;
    
    return {
      vehicle,
      totalCollections: vehicleCollections.length,
      totalAmount,
      averageAmount,
      percentOfTarget
    };
  });
  
  // Sort by percent of target (descending)
  performance.sort((a, b) => b.percentOfTarget - a.percentOfTarget);
  
  console.log('\n TOP PERFORMERS:\n');
  
  performance.slice(0, 3).forEach((perf, index) => {
    if (perf.totalCollections === 0) return;
    
    console.log(`${index + 1}. ${perf.vehicle.registration} - ${perf.vehicle.route}`);
    console.log(`   Collections: ${perf.totalCollections} days`);
    console.log(`   Average: ${formatCurrency(perf.averageAmount)}`);
    console.log(`   Target: ${formatCurrency(perf.vehicle.dailyTarget)}`);
    console.log(`   Achievement: ${perf.percentOfTarget.toFixed(1)}%`);
    console.log('');
  });
  
  console.log('\n  NEEDS IMPROVEMENT:\n');
  
  const bottomPerformers = performance.filter(p => p.totalCollections > 0).slice(-3).reverse();
  
  bottomPerformers.forEach((perf, index) => {
    console.log(`${index + 1}. ${perf.vehicle.registration} - ${perf.vehicle.route}`);
    console.log(`   Collections: ${perf.totalCollections} days`);
    console.log(`   Average: ${formatCurrency(perf.averageAmount)}`);
    console.log(`   Target: ${formatCurrency(perf.vehicle.dailyTarget)}`);
    console.log(`   Achievement: ${perf.percentOfTarget.toFixed(1)}%`);
    console.log('');
  });
  
  pause();
}

/**
 * Flag below-target collections
 */
export function viewBelowTargetCollections(): void {
  printHeader('  BELOW TARGET COLLECTIONS');
  
  const collections = loadCollections();
  const vehicles = loadVehicles();
  const drivers = loadDrivers();
  
  if (collections.length === 0) {
    console.log('\n No collections data available.');
    pause();
    return;
  }
  
  // Find all below-target collections
  const belowTarget = collections.filter(c => {
    const vehicle = vehicles.find(v => v.id === c.vehicleId);
    return vehicle && c.amount < vehicle.dailyTarget;
  });
  
  if (belowTarget.length === 0) {
    console.log('\n Great! All collections have met their targets!');
    pause();
    return;
  }
  
  console.log(`\n  Found ${belowTarget.length} below-target collections:\n`);
  
  // Sort by date (most recent first)
  belowTarget.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  belowTarget.forEach((collection, index) => {
    const vehicle = vehicles.find(v => v.id === collection.vehicleId);
    const driver = drivers.find(d => d.id === collection.driverId);
    
    if (!vehicle) return;
    
    const shortfall = vehicle.dailyTarget - collection.amount;
    const percentAchieved = (collection.amount / vehicle.dailyTarget) * 100;
    
    console.log(`${index + 1}. [${collection.date}] ${vehicle.registration}`);
    console.log(`   Route: ${vehicle.route}`);
    console.log(`   Driver: ${driver?.name || 'Unassigned'}`);
    console.log(`   Collected: ${formatCurrency(collection.amount)}`);
    console.log(`   Target: ${formatCurrency(vehicle.dailyTarget)}`);
    console.log(`   Shortfall: ${formatCurrency(shortfall)} (${percentAchieved.toFixed(1)}%)`);
    console.log('');
  });
  
  pause();
}

/**
 * Collections Management submenu
 */
export function collectionsManagementMenu(): void {
  let running = true;
  
  while (running) {
    printHeader(' COLLECTIONS MANAGEMENT');
    
    console.log('1. Record Daily Collection');
    console.log('2. View Collections by Date');
    console.log('3. View All Collections');
    console.log('4. Calculate Period Totals');
    console.log('5. Performance Rankings');
    console.log('6. Below Target Collections');
    console.log('7. Back to Main Menu');
    printBorder(50);
    
    const choice = readlineSync.question('\nSelect option: ').trim();
    
    switch (choice) {
      case '1':
        recordCollection();
        break;
      case '2':
        viewCollectionsByDate();
        break;
      case '3':
        viewAllCollections();
        break;
      case '4':
        calculatePeriodTotals();
        break;
      case '5':
        viewPerformanceRankings();
        break;
      case '6':
        viewBelowTargetCollections();
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