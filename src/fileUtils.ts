import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url'; // Add this
import type { Vehicle, Driver, Collection, Expense } from './types.js';

// Define __dirname manually for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the data directory path
const DATA_DIR = path.join(__dirname, '..', 'data');

// File paths
const VEHICLES_FILE = path.join(DATA_DIR, 'vehicles.json');
const DRIVERS_FILE = path.join(DATA_DIR, 'drivers.json');
const COLLECTIONS_FILE = path.join(DATA_DIR, 'collections.json');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');

/**
 * Generic function to read JSON file
 * Returns parsed data or empty array if file doesn't exist/is invalid
 */
function readJSONFile<T>(filePath: string): T[] {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}. Creating new file...`);
      writeJSONFile(filePath, []);
      return [];
    }

    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Handle empty files
    if (!fileContent.trim()) {
      return [];
    }

    // Parse and return JSON
    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [];
    
  } catch (error) {
    console.error(` Error reading file ${filePath}:`, error);
    return [];
  }
}

/**
 * Generic function to write data to JSON file
 */
function writeJSONFile<T>(filePath: string, data: T[]): boolean {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write data with pretty formatting (2 spaces)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
    
  } catch (error) {
    console.error(` Error writing file ${filePath}:`, error);
    return false;
  }
}

// ============================================
// VEHICLE FUNCTIONS
// ============================================

export function loadVehicles(): Vehicle[] {
  return readJSONFile<Vehicle>(VEHICLES_FILE);
}

export function saveVehicles(vehicles: Vehicle[]): boolean {
  return writeJSONFile(VEHICLES_FILE, vehicles);
}

// ============================================
// DRIVER FUNCTIONS
// ============================================

export function loadDrivers(): Driver[] {
  return readJSONFile<Driver>(DRIVERS_FILE);
}

export function saveDrivers(drivers: Driver[]): boolean {
  return writeJSONFile(DRIVERS_FILE, drivers);
}

// ============================================
// COLLECTION FUNCTIONS
// ============================================

export function loadCollections(): Collection[] {
  return readJSONFile<Collection>(COLLECTIONS_FILE);
}

export function saveCollections(collections: Collection[]): boolean {
  return writeJSONFile(COLLECTIONS_FILE, collections);
}

// ============================================
// EXPENSE FUNCTIONS
// ============================================

export function loadExpenses(): Expense[] {
  return readJSONFile<Expense>(EXPENSES_FILE);
}

export function saveExpenses(expenses: Expense[]): boolean {
  return writeJSONFile(EXPENSES_FILE, expenses);
}

// ============================================
// CSV EXPORT FUNCTIONS
// ============================================

/**
 * Export vehicles to CSV format
 */
export function exportVehiclesToCSV(vehicles: Vehicle[], filename: string = 'vehicles_export.csv'): boolean {
  try {
    const filePath = path.join(DATA_DIR, filename);
    
    // CSV Header
    let csv = 'ID,Registration,Capacity,Route,Daily Target,Status,Assigned Driver ID\n';
    
    // Add data rows
    vehicles.forEach(vehicle => {
      csv += `${vehicle.id},${vehicle.registration},${vehicle.capacity},${vehicle.route},${vehicle.dailyTarget},${vehicle.status},${vehicle.assignedDriverId || 'None'}\n`;
    });
    
    fs.writeFileSync(filePath, csv, 'utf-8');
    console.log(` Vehicles exported to: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(' Error exporting vehicles to CSV:', error);
    return false;
  }
}

/**
 * Export collections to CSV format
 */
export function exportCollectionsToCSV(
  collections: Collection[], 
  vehicles: Vehicle[], 
  drivers: Driver[], 
  filename: string = 'collections_export.csv'
): boolean {
  try {
    const filePath = path.join(DATA_DIR, filename);
    
    // CSV Header
    let csv = 'ID,Date,Vehicle Registration,Driver Name,Amount,Route\n';
    
    // Add data rows with lookups
    collections.forEach(collection => {
      const vehicle = vehicles.find(v => v.id === collection.vehicleId);
      const driver = drivers.find(d => d.id === collection.driverId);
      
      csv += `${collection.id},${collection.date},${vehicle?.registration || 'Unknown'},${driver?.name || 'Unknown'},${collection.amount},${vehicle?.route || 'Unknown'}\n`;
    });
    
    fs.writeFileSync(filePath, csv, 'utf-8');
    console.log(` Collections exported to: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(' Error exporting collections to CSV:', error);
    return false;
  }
}

/**
 * Export expenses to CSV format
 */
export function exportExpensesToCSV(
  expenses: Expense[], 
  vehicles: Vehicle[], 
  filename: string = 'expenses_export.csv'
): boolean {
  try {
    const filePath = path.join(DATA_DIR, filename);
    
    // CSV Header
    let csv = 'ID,Date,Vehicle Registration,Category,Description,Amount\n';
    
    // Add data rows
    expenses.forEach(expense => {
      const vehicle = vehicles.find(v => v.id === expense.vehicleId);
      
      csv += `${expense.id},${expense.date},${vehicle?.registration || 'Unknown'},${expense.category},${expense.description},${expense.amount}\n`;
    });
    
    fs.writeFileSync(filePath, csv, 'utf-8');
    console.log(` Expenses exported to: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(' Error exporting expenses to CSV:', error);
    return false;
  }
}

/**
 * Load all data at once (useful for app initialization)
 */
export function loadAllData(): {
  vehicles: Vehicle[];
  drivers: Driver[];
  collections: Collection[];
  expenses: Expense[];
} {
  return {
    vehicles: loadVehicles(),
    drivers: loadDrivers(),
    collections: loadCollections(),
    expenses: loadExpenses()
  };
}