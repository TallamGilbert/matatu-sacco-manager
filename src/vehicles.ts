import * as readlineSync from 'readline-sync';
import type { Vehicle, VehicleStatus } from './types.js'; // Added 'type' and '.js'
import { loadVehicles, saveVehicles, loadDrivers } from './fileUtils.js';
import { 
  generateId, 
  formatCurrency, 
  isValidRegistration, 
  formatRegistration,
  findVehicleByRegistration,
  printHeader,
  printBorder,
  pause
} from './utils.js';
import { /* your imports */ } from './utils.js';

/**
 * Add a new vehicle to the fleet
 */
export function addVehicle(): void {
  printHeader(' ADD NEW VEHICLE');
  
  const vehicles = loadVehicles();
  
  // Get vehicle registration
  let registration = '';
  while (true) {
    registration = readlineSync.question('\nVehicle Registration (e.g., KCB 123A): ').trim();
    
    if (!registration) {
      console.log(' Registration cannot be empty.');
      continue;
    }
    
    if (!isValidRegistration(registration)) {
      console.log(' Invalid registration format. Use format: KCB 123A');
      continue;
    }
    
    // Format and check for duplicates
    registration = formatRegistration(registration);
    const existing = findVehicleByRegistration(vehicles, registration);
    
    if (existing) {
      console.log(` Vehicle with registration ${registration} already exists!`);
      continue;
    }
    
    break;
  }
  
  // Get capacity
  let capacity = 0;
  while (true) {
    const input = readlineSync.question('Passenger Capacity (e.g., 14, 33): ').trim();
    capacity = parseInt(input);
    
    if (isNaN(capacity) || capacity <= 0) {
      console.log(' Capacity must be a positive number.');
      continue;
    }
    
    if (capacity > 60) {
      console.log('Capacity seems too high. Please enter a realistic value.');
      continue;
    }
    
    break;
  }
  
  // Get route
  let route = '';
  while (true) {
    route = readlineSync.question('Route (e.g., CBD - Kibera): ').trim();
    
    if (!route) {
      console.log(' Route cannot be empty.');
      continue;
    }
    
    break;
  }
  
  // Get daily target
  let dailyTarget = 0;
  while (true) {
    const input = readlineSync.question('Daily Collection Target (KES): ').trim();
    dailyTarget = parseFloat(input);
    
    if (isNaN(dailyTarget) || dailyTarget <= 0) {
      console.log(' Daily target must be a positive number.');
      continue;
    }
    
    break;
  }
  
  // Get status (default to active)
  console.log('\nVehicle Status:');
  console.log('1. Active');
  console.log('2. Inactive');
  console.log('3. Maintenance');
  
  const statusChoice = readlineSync.question('Select status [1]: ').trim() || '1';
  
  let status: VehicleStatus = 'active';
  switch (statusChoice) {
    case '2':
      status = 'inactive';
      break;
    case '3':
      status = 'maintenance';
      break;
    default:
      status = 'active';
  }
  
  // Generate new ID
const existingIds = vehicles.map((v: Vehicle) => v.id);
  const newId = generateId('v', existingIds);
  
  // Create new vehicle
  const newVehicle: Vehicle = {
    id: newId,
    registration,
    capacity,
    route,
    dailyTarget,
    status,
    assignedDriverId: null
  };
  
  // Add to array and save
  vehicles.push(newVehicle);
  
  if (saveVehicles(vehicles)) {
    console.log('\n Vehicle added successfully!');
    console.log(printBorder(50));
    console.log(`ID: ${newVehicle.id}`);
    console.log(`Registration: ${newVehicle.registration}`);
    console.log(`Capacity: ${newVehicle.capacity} passengers`);
    console.log(`Route: ${newVehicle.route}`);
    console.log(`Daily Target: ${formatCurrency(newVehicle.dailyTarget)}`);
    console.log(`Status: ${newVehicle.status}`);
    printBorder(50);
  } else {
    console.log(' Failed to save vehicle.');
  }
  
  pause();
}

/**
 * View all vehicles
 */
export function viewAllVehicles(): void {
  printHeader('ALL VEHICLES');
  
  const vehicles = loadVehicles();
  const drivers = loadDrivers();
  
  if (vehicles.length === 0) {
    console.log('\n No vehicles found. Add your first vehicle!');
    pause();
    return;
  }
  
  console.log(`\nTotal Vehicles: ${vehicles.length}\n`);
  
vehicles.forEach((vehicle: Vehicle, index: number) => {
    // Find assigned driver
    const driver = drivers.find(d => d.id === vehicle.assignedDriverId);
    
    console.log(`${index + 1}. ${vehicle.registration} (${vehicle.id})`);
    console.log(`   Route: ${vehicle.route}`);
    console.log(`   Capacity: ${vehicle.capacity} passengers`);
    console.log(`   Daily Target: ${formatCurrency(vehicle.dailyTarget)}`);
    console.log(`   Status: ${vehicle.status.toUpperCase()}`);
    console.log(`   Driver: ${driver ? driver.name : 'Not assigned'}`);
    console.log('');
  });
  
  pause();
}

/**
 * Search vehicles by registration or route
 */
export function searchVehicles(): void {
  printHeader(' SEARCH VEHICLES');
  
  const vehicles = loadVehicles();
  
  if (vehicles.length === 0) {
    console.log('\n No vehicles in the system.');
    pause();
    return;
  }
  
  console.log('\nSearch by:');
  console.log('1. Registration Number');
  console.log('2. Route');
  console.log('3. Status');
  
  const choice = readlineSync.question('\nSelect option: ').trim();
  
  let results: Vehicle[] = [];
  
  switch (choice) {
    case '1':
      const registration = readlineSync.question('Enter registration (partial match): ').trim();
      results = vehicles.filter(v => 
        v.registration.toLowerCase().includes(registration.toLowerCase())
      );
      break;
      
    case '2':
      const route = readlineSync.question('Enter route (partial match): ').trim();
      results = vehicles.filter(v => 
        v.route.toLowerCase().includes(route.toLowerCase())
      );
      break;
      
    case '3':
      console.log('\n1. Active');
      console.log('2. Inactive');
      console.log('3. Maintenance');
      const statusChoice = readlineSync.question('\nSelect status: ').trim();
      
      let searchStatus: VehicleStatus = 'active';
      if (statusChoice === '2') searchStatus = 'inactive';
      else if (statusChoice === '3') searchStatus = 'maintenance';
      
      results = vehicles.filter(v => v.status === searchStatus);
      break;
      
    default:
      console.log(' Invalid option.');
      pause();
      return;
  }
  
  // Display results
  console.log(`\n Found ${results.length} vehicle(s):\n`);
  
  if (results.length === 0) {
    console.log('No matches found.');
  } else {
    const drivers = loadDrivers();
    results.forEach((vehicle, index) => {
      const driver = drivers.find(d => d.id === vehicle.assignedDriverId);
      
      console.log(`${index + 1}. ${vehicle.registration} (${vehicle.id})`);
      console.log(`   Route: ${vehicle.route}`);
      console.log(`   Capacity: ${vehicle.capacity} passengers`);
      console.log(`   Daily Target: ${formatCurrency(vehicle.dailyTarget)}`);
      console.log(`   Status: ${vehicle.status.toUpperCase()}`);
      console.log(`   Driver: ${driver ? driver.name : 'Not assigned'}`);
      console.log('');
    });
  }
  
  pause();
}

/**
 * Update vehicle details
 */
export function updateVehicle(): void {
  printHeader('  UPDATE VEHICLE');
  
  const vehicles = loadVehicles();
  
  if (vehicles.length === 0) {
    console.log('\n No vehicles to update.');
    pause();
    return;
  }
  
  // Find vehicle
  const registration = readlineSync.question('\nEnter vehicle registration: ').trim();
  const vehicle = findVehicleByRegistration(vehicles, registration);
  
  if (!vehicle) {
    console.log(` Vehicle ${registration} not found.`);
    pause();
    return;
  }
  
  // Display current details
  console.log('\n Current Details:');
  printBorder(50);
  console.log(`Registration: ${vehicle.registration}`);
  console.log(`Capacity: ${vehicle.capacity} passengers`);
  console.log(`Route: ${vehicle.route}`);
  console.log(`Daily Target: ${formatCurrency(vehicle.dailyTarget)}`);
  console.log(`Status: ${vehicle.status}`);
  printBorder(50);
  
  // Update menu
  console.log('\nWhat would you like to update?');
  console.log('1. Route');
  console.log('2. Daily Target');
  console.log('3. Status');
  console.log('4. Capacity');
  console.log('5. Cancel');
  
  const choice = readlineSync.question('\nSelect option: ').trim();
  
  switch (choice) {
    case '1':
      const newRoute = readlineSync.question(`New route [${vehicle.route}]: `).trim();
      if (newRoute) {
        vehicle.route = newRoute;
        console.log(' Route updated.');
      }
      break;
      
    case '2':
      const targetInput = readlineSync.question(`New daily target [${vehicle.dailyTarget}]: `).trim();
      if (targetInput) {
        const newTarget = parseFloat(targetInput);
        if (!isNaN(newTarget) && newTarget > 0) {
          vehicle.dailyTarget = newTarget;
          console.log(' Daily target updated.');
        } else {
          console.log(' Invalid amount.');
        }
      }
      break;
      
    case '3':
      console.log('\n1. Active');
      console.log('2. Inactive');
      console.log('3. Maintenance');
      const statusChoice = readlineSync.question('Select new status: ').trim();
      
      if (statusChoice === '1') vehicle.status = 'active';
      else if (statusChoice === '2') vehicle.status = 'inactive';
      else if (statusChoice === '3') vehicle.status = 'maintenance';
      else {
        console.log(' Invalid status.');
        pause();
        return;
      }
      console.log(' Status updated.');
      break;
      
    case '4':
      const capacityInput = readlineSync.question(`New capacity [${vehicle.capacity}]: `).trim();
      if (capacityInput) {
        const newCapacity = parseInt(capacityInput);
        if (!isNaN(newCapacity) && newCapacity > 0) {
          vehicle.capacity = newCapacity;
          console.log(' Capacity updated.');
        } else {
          console.log(' Invalid capacity.');
        }
      }
      break;
      
    case '5':
      console.log('Update cancelled.');
      pause();
      return;
      
    default:
      console.log(' Invalid option.');
      pause();
      return;
  }
  
  // Save changes
  if (saveVehicles(vehicles)) {
    console.log('\n Changes saved successfully!');
  } else {
    console.log(' Failed to save changes.');
  }
  
  pause();
}

/**
 * Vehicle Management submenu
 */
export function vehicleManagementMenu(): void {
  let running = true;
  
  while (running) {
    printHeader(' VEHICLE MANAGEMENT');
    
    console.log('1. Add New Vehicle');
    console.log('2. View All Vehicles');
    console.log('3. Search Vehicles');
    console.log('4. Update Vehicle');
    console.log('5. Back to Main Menu');
    printBorder(50);
    
    const choice = readlineSync.question('\nSelect option: ').trim();
    
    switch (choice) {
      case '1':
        addVehicle();
        break;
      case '2':
        viewAllVehicles();
        break;
      case '3':
        searchVehicles();
        break;
      case '4':
        updateVehicle();
        break;
      case '5':
        running = false;
        break;
      default:
        console.log(' Invalid option. Please try again.');
        pause();
    }
  }
}