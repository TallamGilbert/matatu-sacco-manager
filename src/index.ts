// 1. Fixed the import to match ES Module / verbatimModuleSyntax requirements
import readlineSync from 'readline-sync'; 
import { loadAllData } from './fileUtils.js';
import { printHeader, printBorder } from './utils.js';
import { vehicleManagementMenu } from './vehicles.js';
import { driverManagementMenu } from './drivers.js';
import { collectionsManagementMenu } from './collections.js';
import { expenseManagementMenu } from './expenses.js';
import { exportMenu, reportsMenu } from './reports.js';

function displayMenu(): void {
  console.log('\n==================================================');
  console.log('       MATATU SACCO MANAGER - Main Menu');
  console.log('==================================================');
  console.log('1. Vehicle Management');
  console.log('2. Driver Management');
  console.log('3. Record Collection');
  console.log('4. Record Expense');
  console.log('5. Reports');
  console.log('6. Export Data');
  console.log('7. Exit');
  console.log('==================================================');
}

function main(): void {
  printHeader(' MATATU SACCO MANAGER ');
  
  // Load all data on startup
  console.log('\n Loading data...');
  const data = loadAllData();
  
  console.log(` Loaded ${data.vehicles.length} vehicles`);
  console.log(` Loaded ${data.drivers.length} drivers`);
  console.log(` Loaded ${data.collections.length} collections`);
  console.log(` Loaded ${data.expenses.length} expenses`);
  
  let running = true;
  
  while (running) {
    displayMenu();
    const choice = readlineSync.question('\nSelect option: ').trim();
    
    switch (choice) {
      case '1':
        vehicleManagementMenu();
        break;
      case '2':
        driverManagementMenu();
        break;
      case '3':
        collectionsManagementMenu();
        break;
      case '4':
        expenseManagementMenu();
        break;
      case '5':
        reportsMenu();
        break;
      case '6':
        exportMenu();
        break;
      case '7':
        console.log('\n Thank you for using Matatu Sacco Manager!');
        running = false;
        break;
      default:
        console.log('\n Invalid option. Please try again.');
        readlineSync.question('\nPress Enter to continue...');
    }
  }
}

// Start the application
main();
