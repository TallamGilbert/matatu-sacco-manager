// Vehicle status options
export type VehicleStatus = "active" | "inactive" | "maintenance";

// Expense categories
export type ExpenseCategory = "fuel" | "repair" | "fine" | "insurance" | "other";

// Vehicle interface
export interface Vehicle {
  id: string;
  registration: string;
  capacity: number;
  route: string;
  dailyTarget: number;
  status: VehicleStatus;
  assignedDriverId: string | null;
}

// Driver interface
export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string; // YYYY-MM-DD format
  assignedVehicleId: string | null;
}

// Collection interface
export interface Collection {
  id: string;
  vehicleId: string;
  driverId: string;
  date: string; // YYYY-MM-DD format
  amount: number;
}

// Expense interface
export interface Expense {
  id: string;
  vehicleId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD format
}