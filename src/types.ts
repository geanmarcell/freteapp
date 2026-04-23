export type PlatformId = 
  | 'freight' 
  | 'uber' 
  | '99' 
  | '99cargo' 
  | 'indriver' 
  | 'ifood' 
  | 'lalamove' 
  | 'fretebras' 
  | 'uberfreight' 
  | 'other';

export interface Platform {
  id: PlatformId;
  name: string;
  color: string;
  isFreight: boolean;
}

export interface Client {
  id: string;
  empresa: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  observacao: string;
}

export interface Ride {
  id: string;
  date: string;
  time: string;
  platform: PlatformId;
  type: 'ride' | 'freight';
  netValue: string;
  distance: string;
  tips: string;
  duration?: string; // in minutes
  notes: string;
  clientId?: string;
  clientName?: string;
  clientContact?: string;
  invoiceNumber?: string;
}

export interface FuelRecord {
  id: string;
  date: string;
  startKm: string;
  endKm: string;
  liters: string;
  fuelPrice: string;
  totalFuelCost: string;
  consumption: number;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: string;
  currentKm?: string;
  linkedFuelId?: string;
}
