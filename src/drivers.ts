import * as readlineSync from 'readline-sync';
import type { Driver } from './types.js';
import { loadDrivers, saveDrivers, loadVehicles, saveVehicles, loadCollections } from './fileUtils.js';
import { 
  generateId, 
  formatCurrency,
  isValidPhone, 
  formatPhone,
  isValidDate,
  getTodayDate,
  isDueWithinDays,
  daysUntil,
  findDriverByName,
  findVehicleByRegistration,
  printHeader,
  printBorder,
  pause
} from './utils.js';

/**
 * Add a new driver
 */
export function addDriver(): void {
  printHeader(' ADD NEW DRIVER');
  
  const drivers = loadDrivers();
  
  // Get driver name
  let name = '';
  while (true) {
    name = readlineSync.question('\nDriver Full Name: ').trim();
    
    if (!name) {
      console.log(' Name cannot be empty.');
      continue;
    }
    
    if (name.length < 3) {
      console.log(' Name must be at least 3 characters.');
      continue;
    }
    
    break;
  }
  
  // Get phone number
  let phone = '';
  while (true) {
    phone = readlineSync.question('Phone Number (e.g., 0712345678): ').trim();
    
    if (!phone) {
      console.log(' Phone number cannot be empty.');
      continue;
    }
    
    if (!isValidPhone(phone)) {
      console.log(' Invalid phone number format. Use: 0712345678 or +254712345678');
      continue;
    }
    
    phone = formatPhone(phone);
    
    // Check for duplicate
    const existingDriver = drivers.find(d => d.phone === phone);
    if (existingDriver) {
      console.log(` A driver with phone ${phone} already exists (${existingDriver.name}).`);
      continue;
    }
    
    break;
  }
  
  // Get license number
  let licenseNumber = '';
  while (true) {
    licenseNumber = readlineSync.question('License Number (e.g., DL12345): ').trim().toUpperCase();
    
    if (!licenseNumber) {
      console.log(' License number cannot be empty.');
      continue;
    }
    
    if (licenseNumber.length < 5) {
      console.log(' License number must be at least 5 characters.');
      continue;
    }
    
    // Check for duplicate
    const existingLicense = drivers.find(d => d.licenseNumber === licenseNumber);
    if (existingLicense) {
      console.log(` License ${licenseNumber} already registered to ${existingLicense.name}.`);
      continue;
    }
    
    break;
  }
  
  // Get license expiry date
  let licenseExpiry = '';
  while (true) {
    const input = readlineSync.question('License Expiry Date (YYYY-MM-DD): ').trim();
    
    if (!input) {
      console.log(' Expiry date cannot be empty.');
      continue;
    }
    
    if (!isValidDate(input)) {
      console.log(' Invalid date format. Use YYYY-MM-DD (e.g., 2026-12-31)');
      continue;
    }
    
    // Check if date is in the past
    const expiryDate = new Date(input);
    const today = new Date();
    
    if (expiryDate < today) {
      console.log(' License expiry date cannot be in the past.');
      continue;
    }
    
    licenseExpiry = input;
    break;
  }
  
  // Generate new ID
  const existingIds = drivers.map(d => d.id);
  const newId = generateId('d', existingIds);
  
  // Create new driver
  const newDriver: Driver = {
    id: newId,
    name,
    phone,
    licenseNumber,
    licenseExpiry,
    assignedVehicleId: null
  };
  
  // Add to array and save
  drivers.push(newDriver);
  
  if (saveDrivers(drivers)) {
    console.log('\n Driver added successfully!');
    printBorder(50);
    console.log(`ID: ${newDriver.id}`);
    console.log(`Name: ${newDriver.name}`);
    console.log(`Phone: ${newDriver.phone}`);
    console.log(`License: ${newDriver.licenseNumber}`);
    console.log(`Expiry: ${newDriver.licenseExpiry}`);
    
    // Check if expiring soon
    if (isDueWithinDays(licenseExpiry, 30)) {
      const days = daysUntil(licenseExpiry);
      console.log(`  Warning: License expires in ${days} days!`);
    }
    
    printBorder(50);
  } else {
    console.log(' Failed to save driver.');
  }
  
  pause();
}

/**
 * View all drivers
 */
export function viewAllDrivers(): void {
  printHeader(' ALL DRIVERS');
  
  const drivers = loadDrivers();
  const vehicles = loadVehicles();
  
  if (drivers.length === 0) {
    console.log('\n No drivers found. Add your first driver!');
    pause();
    return;
  }
  
  console.log(`\nTotal Drivers: ${drivers.length}\n`);
  
  drivers.forEach((driver, index) => {
    // Find assigned vehicle
    const vehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
    
    console.log(`${index + 1}. ${driver.name} (${driver.id})`);
    console.log(`   Phone: ${driver.phone}`);
    console.log(`   License: ${driver.licenseNumber}`);
    console.log(`   Expiry: ${driver.licenseExpiry}`);
    
    // Check if license is expiring soon
    const days = daysUntil(driver.licenseExpiry);
    if (days < 0) {
      console.log(`    EXPIRED ${Math.abs(days)} days ago!`);
    } else if (days <= 7) {
      console.log(`     URGENT: Expires in ${days} days!`);
    } else if (days <= 30) {
      console.log(`     Expires in ${days} days`);
    }
    
    console.log(`   Vehicle: ${vehicle ? `${vehicle.registration} (${vehicle.route})` : 'Not assigned'}`);
    console.log('');
  });
  
  pause();
}

/**
 * Assign driver to a vehicle
 */
export function assignDriverToVehicle(): void {
  printHeader(' ASSIGN DRIVER TO VEHICLE');
  
  const drivers = loadDrivers();
  const vehicles = loadVehicles();
  
  if (drivers.length === 0) {
    console.log('\n No drivers available. Add drivers first.');
    pause();
    return;
  }
  
  if (vehicles.length === 0) {
    console.log('\n No vehicles available. Add vehicles first.');
    pause();
    return;
  }
  
  // Find driver
  const driverName = readlineSync.question('\nEnter driver name (partial match): ').trim();
  const matchingDrivers = findDriverByName(drivers, driverName);
  
  if (matchingDrivers.length === 0) {
    console.log(` No drivers found matching "${driverName}".`);
    pause();
    return;
  }
  
  let selectedDriver: Driver;
  
  if (matchingDrivers.length === 1) {
    selectedDriver = matchingDrivers[0]!;
    console.log(`\nSelected: ${selectedDriver.name}`);
  } else {
    console.log(`\nFound ${matchingDrivers.length} matching drivers:`);
    matchingDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name} (${driver.phone})`);
    });
    
    const choice = parseInt(readlineSync.question('\nSelect driver number: ').trim());
    
    if (isNaN(choice) || choice < 1 || choice > matchingDrivers.length) {
      console.log(' Invalid selection.');
      pause();
      return;
    }
    
    selectedDriver = matchingDrivers[choice - 1]!;
  }
  
  // Check if driver already has a vehicle
  if (selectedDriver.assignedVehicleId) {
    const currentVehicle = vehicles.find(v => v.id === selectedDriver.assignedVehicleId);
    console.log(`\n  ${selectedDriver.name} is currently assigned to ${currentVehicle?.registration}`);
    const confirm = readlineSync.question('Reassign to a different vehicle? (y/n): ').trim().toLowerCase();
    
    if (confirm !== 'y' && confirm !== 'yes') {
      console.log('Assignment cancelled.');
      pause();
      return;
    }
  }
  
  // Find vehicle
  const vehicleReg = readlineSync.question('\nEnter vehicle registration: ').trim();
  const vehicle = findVehicleByRegistration(vehicles, vehicleReg);
  
  if (!vehicle) {
    console.log(` Vehicle ${vehicleReg} not found.`);
    pause();
    return;
  }
  
  // Check if vehicle already has a driver
  if (vehicle.assignedDriverId && vehicle.assignedDriverId !== selectedDriver.id) {
    const currentDriver = drivers.find(d => d.id === vehicle.assignedDriverId);
    console.log(`\n  ${vehicle.registration} is currently assigned to ${currentDriver?.name}`);
    const confirm = readlineSync.question('Replace with new driver? (y/n): ').trim().toLowerCase();
    
    if (confirm !== 'y' && confirm !== 'yes') {
      console.log('Assignment cancelled.');
      pause();
      return;
    }
    
    // Unassign previous driver
    if (currentDriver) {
      currentDriver.assignedVehicleId = null;
    }
  }
  
  // Unassign driver from previous vehicle if any
  if (selectedDriver.assignedVehicleId && selectedDriver.assignedVehicleId !== vehicle.id) {
    const previousVehicle = vehicles.find(v => v.id === selectedDriver.assignedVehicleId);
    if (previousVehicle) {
      previousVehicle.assignedDriverId = null;
    }
  }
  
  // Make the assignment
  selectedDriver.assignedVehicleId = vehicle.id;
  vehicle.assignedDriverId = selectedDriver.id;
  
  // Save both
  if (saveDrivers(drivers) && saveVehicles(vehicles)) {
    console.log('\n Assignment successful!');
    printBorder(50);
    console.log(`Driver: ${selectedDriver.name}`);
    console.log(`Vehicle: ${vehicle.registration}`);
    console.log(`Route: ${vehicle.route}`);
    printBorder(50);
  } else {
    console.log(' Failed to save assignment.');
  }
  
  pause();
}

/**
 * View drivers with expiring licenses
 */
export function viewExpiringLicenses(): void {
  printHeader('  LICENSE EXPIRY ALERTS');
  
  const drivers = loadDrivers();
  
  if (drivers.length === 0) {
    console.log('\n No drivers in the system.');
    pause();
    return;
  }
  
  console.log('\nSelect timeframe:');
  console.log('1. Expired licenses');
  console.log('2. Expiring within 7 days');
  console.log('3. Expiring within 30 days');
  
  const choice = readlineSync.question('\nSelect option: ').trim();
  
  let filteredDrivers: Driver[] = [];
  let title = '';
  
  switch (choice) {
    case '1':
      filteredDrivers = drivers.filter(d => daysUntil(d.licenseExpiry) < 0);
      title = ' EXPIRED LICENSES';
      break;
    case '2':
      filteredDrivers = drivers.filter(d => {
        const days = daysUntil(d.licenseExpiry);
        return days >= 0 && days <= 7;
      });
      title = ' EXPIRING WITHIN 7 DAYS';
      break;
    case '3':
      filteredDrivers = drivers.filter(d => {
        const days = daysUntil(d.licenseExpiry);
        return days >= 0 && days <= 30;
      });
      title = '  EXPIRING WITHIN 30 DAYS';
      break;
    default:
      console.log(' Invalid option.');
      pause();
      return;
  }
  
  console.log(`\n${title}`);
  console.log(`Found: ${filteredDrivers.length} driver(s)\n`);
  
  if (filteredDrivers.length === 0) {
    console.log(' No licenses in this category.');
  } else {
    const vehicles = loadVehicles();
    
    filteredDrivers.forEach((driver, index) => {
      const vehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
      const days = daysUntil(driver.licenseExpiry);
      
      console.log(`${index + 1}. ${driver.name}`);
      console.log(`   License: ${driver.licenseNumber}`);
      console.log(`   Expiry: ${driver.licenseExpiry}`);
      
      if (days < 0) {
        console.log(`   Status:  EXPIRED ${Math.abs(days)} days ago`);
      } else {
        console.log(`   Status:   Expires in ${days} days`);
      }
      
      console.log(`   Phone: ${driver.phone}`);
      console.log(`   Vehicle: ${vehicle ? vehicle.registration : 'Not assigned'}`);
      console.log('');
    });
  }
  
  pause();
}

/**
 * Calculate driver performance
 */
export function viewDriverPerformance(): void {
  printHeader(' DRIVER PERFORMANCE');
  
  const drivers = loadDrivers();
  const collections = loadCollections();
  const vehicles = loadVehicles();
  
  if (drivers.length === 0) {
    console.log('\n No drivers in the system.');
    pause();
    return;
  }
  
  if (collections.length === 0) {
    console.log('\n No collection data available.');
    pause();
    return;
  }
  
  // Calculate performance for each driver
  const performance = drivers.map(driver => {
    const driverCollections = collections.filter(c => c.driverId === driver.id);
    
    if (driverCollections.length === 0) {
      return {
        driver,
        totalCollections: 0,
        totalAmount: 0,
        averageAmount: 0
      };
    }
    
    const totalAmount = driverCollections.reduce((sum, c) => sum + c.amount, 0);
    const averageAmount = totalAmount / driverCollections.length;
    
    return {
      driver,
      totalCollections: driverCollections.length,
      totalAmount,
      averageAmount
    };
  });
  
  // Sort by average amount (descending)
  performance.sort((a, b) => b.averageAmount - a.averageAmount);
  
  console.log('\n Driver Rankings by Average Daily Collection:\n');
  
  performance.forEach((perf, index) => {
    const vehicle = vehicles.find(v => v.id === perf.driver.assignedVehicleId);
    
    console.log(`${index + 1}. ${perf.driver.name}`);
    console.log(`   Vehicle: ${vehicle ? vehicle.registration : 'Not assigned'}`);
    console.log(`   Total Collections: ${perf.totalCollections} days`);
    console.log(`   Total Amount: ${formatCurrency(perf.totalAmount)}`);
    console.log(`   Average per Day: ${formatCurrency(perf.averageAmount)}`);
    
    if (vehicle && perf.averageAmount > 0) {
      const percentOfTarget = (perf.averageAmount / vehicle.dailyTarget) * 100;
      console.log(`   Target Achievement: ${percentOfTarget.toFixed(1)}%`);
    }
    
    console.log('');
  });
  
  pause();
}

/**
 * Update driver details
 */
export function updateDriver(): void {
  printHeader('  UPDATE DRIVER');
  
  const drivers = loadDrivers();
  
  if (drivers.length === 0) {
    console.log('\n No drivers to update.');
    pause();
    return;
  }
  
  // Find driver
  const driverName = readlineSync.question('\nEnter driver name: ').trim();
  const matchingDrivers = findDriverByName(drivers, driverName);
  
  if (matchingDrivers.length === 0) {
    console.log(` No drivers found matching "${driverName}".`);
    pause();
    return;
  }
  
  let selectedDriver: Driver;
  
  if (matchingDrivers.length === 1) {
    selectedDriver = matchingDrivers[0]!;
  } else {
    console.log(`\nFound ${matchingDrivers.length} matching drivers:`);
    matchingDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name} (${driver.phone})`);
    });
    
    const choice = parseInt(readlineSync.question('\nSelect driver number: ').trim());
    
    if (isNaN(choice) || choice < 1 || choice > matchingDrivers.length) {
      console.log(' Invalid selection.');
      pause();
      return;
    }
    
    selectedDriver = matchingDrivers[choice - 1]!;
  }
  
  // Display current details
  console.log('\n Current Details:');
  printBorder(50);
  console.log(`Name: ${selectedDriver.name}`);
  console.log(`Phone: ${selectedDriver.phone}`);
  console.log(`License: ${selectedDriver.licenseNumber}`);
  console.log(`Expiry: ${selectedDriver.licenseExpiry}`);
  printBorder(50);
  
  // Update menu
  console.log('\nWhat would you like to update?');
  console.log('1. Phone Number');
  console.log('2. License Expiry Date');
  console.log('3. Cancel');
  
  const choice = readlineSync.question('\nSelect option: ').trim();
  
  switch (choice) {
    case '1':
      const newPhone = readlineSync.question(`New phone number [${selectedDriver.phone}]: `).trim();
      if (newPhone) {
        if (!isValidPhone(newPhone)) {
          console.log(' Invalid phone number format.');
          pause();
          return;
        }
        selectedDriver.phone = formatPhone(newPhone);
        console.log(' Phone number updated.');
      }
      break;
      
    case '2':
      const newExpiry = readlineSync.question(`New expiry date [${selectedDriver.licenseExpiry}]: `).trim();
      if (newExpiry) {
        if (!isValidDate(newExpiry)) {
          console.log(' Invalid date format. Use YYYY-MM-DD');
          pause();
          return;
        }
        selectedDriver.licenseExpiry = newExpiry;
        console.log(' License expiry updated.');
        
        // Check if expiring soon
        if (isDueWithinDays(newExpiry, 30)) {
          const days = daysUntil(newExpiry);
          console.log(` Warning: License expires in ${days} days!`);
        }
      }
      break;
      
    case '3':
      console.log('Update cancelled.');
      pause();
      return;
      
    default:
      console.log(' Invalid option.');
      pause();
      return;
  }
  
  // Save changes
  if (saveDrivers(drivers)) {
    console.log('\n Changes saved successfully!');
  } else {
    console.log(' Failed to save changes.');
  }
  
  pause();
}

/**
 * Driver Management submenu
 */
export function driverManagementMenu(): void {
  let running = true;
  
  while (running) {
    printHeader(' DRIVER MANAGEMENT');
    
    console.log('1. Add New Driver');
    console.log('2. View All Drivers');
    console.log('3. Assign Driver to Vehicle');
    console.log('4. View Expiring Licenses');
    console.log('5. View Driver Performance');
    console.log('6. Update Driver Details');
    console.log('7. Back to Main Menu');
    printBorder(50);
    
    const choice = readlineSync.question('\nSelect option: ').trim();
    
    switch (choice) {
      case '1':
        addDriver();
        break;
      case '2':
        viewAllDrivers();
        break;
      case '3':
        assignDriverToVehicle();
        break;
      case '4':
        viewExpiringLicenses();
        break;
      case '5':
        viewDriverPerformance();
        break;
      case '6':
        updateDriver();
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