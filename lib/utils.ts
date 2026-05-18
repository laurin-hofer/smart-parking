import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(value);
}

export function currentFee(entryTime: string | Date, paidBase = 0) {
  const start = new Date(entryTime).getTime();
  const hours = Math.max(0.25, (Date.now() - start) / 1000 / 60 / 60);
  return Number(Math.max(paidBase, hours * 2.4).toFixed(2));
}

export function durationLabel(from: string | Date, to?: string | Date | null) {
  const end = to ? new Date(to).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((end - new Date(from).getTime()) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function normalizePlate(plate: string) {
  return plate.trim().toUpperCase().replace(/\s+/g, "");
}
