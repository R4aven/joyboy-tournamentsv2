
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]){ return twMerge(clsx(inputs)); }
export function formatFCFA(amount: number){ return new Intl.NumberFormat('fr-CI').format(amount)+' FCFA'; }
export function getWhatsAppLink(message: string){ return `https://wa.me/2250748235226?text=${encodeURIComponent(message)}`; }
export const WAVE_NUMBER = "01 51 42 99 18";
export const WHATSAPP_NUMBER = "07 48 23 52 26";
export const PRIX_1V1 = 500;

// Alias compat TournamentCard
export function formatPrice(amount: number){ return new Intl.NumberFormat('fr-CI').format(amount)+' FCFA'; }
export const formatPrix = formatFCFA;
