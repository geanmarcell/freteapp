import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, Fuel, Navigation, Percent, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { Button } from './ui/Button';

interface FreightCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  isTabMode?: boolean;
}

export const FreightCalculator: React.FC<FreightCalculatorProps> = ({ isOpen, onClose, isTabMode = false }) => {
  const [formData, setFormData] = useState({
    distance: '',
    kmPerLiter: '',
    fuelPrice: '',
    toll: '',
    others: '',
    margin: ''
  });

  const [results, setResults] = useState<{
    liters: number;
    fuelCost: number;
    totalCost: number;
    profit: number;
    freightValue: number;
  } | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    const distance = parseFloat(formData.distance) || 0;
    const kmPerLiter = parseFloat(formData.kmPerLiter) || 1;
    const fuelPrice = parseFloat(formData.fuelPrice.replace(',', '.')) || 0;
    const toll = parseFloat(formData.toll.replace(',', '.')) || 0;
    const others = parseFloat(formData.others.replace(',', '.')) || 0;
    const margin = parseFloat(formData.margin) || 0;

    const liters = distance / kmPerLiter;
    const fuelCost = liters * fuelPrice;
    const totalCost = fuelCost + toll + others;
    const profit = totalCost * (margin / 100);
    const freightValue = totalCost + profit;

    setResults({
      liters,
      fuelCost,
      totalCost,
      profit,
      freightValue
    });
  };

  const content = (
    <div className={`relative ${isTabMode ? '' : 'bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl max-w-lg overflow-hidden'} w-full`}>
      {/* Header - only show if not in tab mode (because Layout handles it) */}
      {!isTabMode && (
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-cyan/20 rounded-lg flex items-center justify-center text-accent-cyan">
              <Calculator size={20} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white">Calculadora de Frete</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className={isTabMode ? "grid grid-cols-1 xl:grid-cols-2 gap-8" : ""}>
        <form onSubmit={handleCalculate} className={`${isTabMode ? 'glass-card p-8' : 'p-6'} space-y-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">KM Rodado</label>
              <input 
                type="number" 
                placeholder="Ex: 250"
                className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/50 transition-all"
                value={formData.distance}
                onChange={e => setFormData({ ...formData, distance: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">KM por Litro</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="Ex: 12"
                className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/50 transition-all"
                value={formData.kmPerLiter}
                onChange={e => setFormData({ ...formData, kmPerLiter: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Preço Combustível (R$/L)</label>
              <input 
                type="text" 
                placeholder="Ex: 4,59"
                className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/50 transition-all"
                value={formData.fuelPrice}
                onChange={e => setFormData({ ...formData, fuelPrice: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Pedágio (R$)</label>
              <input 
                type="text" 
                placeholder="Ex: 15"
                className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/50 transition-all"
                value={formData.toll}
                onChange={e => setFormData({ ...formData, toll: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Outros Gastos (R$)</label>
              <input 
                type="text" 
                placeholder="Ex: 10,00"
                className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/50 transition-all"
                value={formData.others}
                onChange={e => setFormData({ ...formData, others: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Margem de Lucro (%)</label>
              <input 
                type="number" 
                placeholder="Ex: 20"
                className="w-full bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/50 transition-all"
                value={formData.margin}
                onChange={e => setFormData({ ...formData, margin: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 gap-2 text-base">
            <Calculator size={20} /> Calcular
          </Button>
        </form>

        {results && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className={`bg-emerald-500/10 border border-emerald-500/20 rounded-2xl overflow-hidden ${isTabMode ? 'p-8 flex flex-col justify-center' : ''}`}
          >
            <div className="p-5 space-y-3 font-medium">
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400/60 mb-4">Resultado do Cálculo</h4>
              <div className="flex justify-between items-center text-sm md:text-base">
                <span className="text-white/60">Combustível Necessário:</span>
                <span className="text-white font-bold">{results.liters.toFixed(2)}L</span>
              </div>
              <div className="flex justify-between items-center text-sm md:text-base">
                <span className="text-white/60">Custo de Combustível:</span>
                <span className="text-white font-bold">{formatCurrency(results.fuelCost)}</span>
              </div>
              <div className="flex justify-between items-center text-sm md:text-base">
                <span className="text-white/60">Custo Operacional Total:</span>
                <span className="text-white font-bold">{formatCurrency(results.totalCost)}</span>
              </div>
              <div className="flex justify-between items-center text-sm md:text-base border-b border-emerald-500/10 pb-4">
                <span className="text-white/60">Lucro Desejado ({formData.margin}%):</span>
                <span className="text-emerald-400 font-bold">+{formatCurrency(results.profit)}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-xl font-bold text-white">Sugestão de Frete:</span>
                <span className="text-3xl font-black text-emerald-400">{formatCurrency(results.freightValue)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  if (isTabMode) return content;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="w-full max-w-lg"
          >
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
