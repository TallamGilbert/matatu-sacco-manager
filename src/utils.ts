import type { Vehicle, Driver } from './types.js';
import readlineSync from 'readline-sync';


/**
 * Generate unique ID with prefix
 * Example: generateId('v') => 'v001'
 */
export function generateId(prefix: string, existingIds: string[]): string {
  let counter = 1;
  let newId = `${prefix}${String(counter).padStart(3, '0')}`;
  
  // Keep incrementing until we find an unused ID
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}${String(counter).padStart(3, '0')}`;
  }
  
  return newId;
}

/**
 * Format currency in KES
 */
export function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate phone number (Kenyan format)
 * Accepts: 0712345678, +254712345678, 254712345678
 */
export function isValidPhone(phone: string): boolean {
  const regex = /^(\+?254|0)?[17]\d{8}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

/**
 * Format phone number to standard format
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  
  if (cleaned.startsWith('+254')) {
    return cleaned;
  } else if (cleaned.startsWith('254')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+254${cleaned.substring(1)}`;
  }
  
  return phone;
}

/**
 * Validate vehicle registration format
 * Example: KCB 123A, KAA 456B
 */
export function isValidRegistration(registration: string): boolean {
  const regex = /^[A-Z]{3}\s?\d{3}[A-Z]$/;
  return regex.test(registration.toUpperCase());
}

/**
 * Format vehicle registration to standard format
 */
export function formatRegistration(registration: string): string {
  const cleaned = registration.replace(/\s/g, '').toUpperCase();
  if (cleaned.length === 7) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }
  return registration.toUpperCase();
}

/**
 * Check if a date is within N days from today
 */
export function isDueWithinDays(dateString: string, days: number): boolean {
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Calculate days until a date
 */
export function daysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Find vehicle by registration number
 */
export function findVehicleByRegistration(vehicles: Vehicle[], registration: string): Vehicle | undefined {
  return vehicles.find(v => 
    v.registration.toLowerCase() === registration.toLowerCase() ||
    v.registration.replace(/\s/g, '').toLowerCase() === registration.replace(/\s/g, '').toLowerCase()
  );
}

/**
 * Find driver by name (partial match)
 */
export function findDriverByName(drivers: Driver[], name: string): Driver[] {
  const searchTerm = name.toLowerCase();
  return drivers.filter(d => d.name.toLowerCase().includes(searchTerm));
}

/**
 * Display a formatted table border
 */
export function printBorder(width: number = 60): void {
  console.log('='.repeat(width));
}

/**
 * Display a section header
 */
export function printHeader(title: string, width: number = 60): void {
  console.log('\n');
  printBorder(width);
  console.log(title.padStart((width + title.length) / 2).padEnd(width));
  printBorder(width);
}

/**
 * Pause and wait for user to press Enter
 */
export function pause(message: string = '\nPress Enter to continue...'): void {
  readlineSync.question(message);
}