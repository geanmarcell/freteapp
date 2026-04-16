import { Platform } from './types';

export const PLATFORMS: Platform[] = [
  { id: 'freight', name: '🚚 Frete Direto', color: 'bg-sky-600', isFreight: true },
  { id: 'uber', name: '🚗 Uber', color: 'bg-gray-900', isFreight: false },
  { id: '99', name: '🚕 99', color: 'bg-yellow-400', isFreight: false },
  { id: '99cargo', name: '📦 99 Cargo', color: 'bg-yellow-500', isFreight: true },
  { id: 'indriver', name: '📱 Indriver', color: 'bg-orange-500', isFreight: false },
  { id: 'ifood', name: '🍔 iFood Entregas', color: 'bg-red-500', isFreight: true },
  { id: 'lalamove', name: '🚛 Lalamove', color: 'bg-orange-400', isFreight: true },
  { id: 'fretebras', name: '🚚 FreteBras', color: 'bg-blue-700', isFreight: true },
  { id: 'uberfreight', name: '🚛 Uber Freight', color: 'bg-black', isFreight: true },
  { id: 'other', name: '📦 Outro', color: 'bg-slate-500', isFreight: false }
];
