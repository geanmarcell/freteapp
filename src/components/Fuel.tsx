import React, { useState, useMemo } from 'react';
import { FuelRecord, Expense } from '../types';
import { generateId, formatCurrency, formatDate, getTodayDateString } from '../lib/utils';
import { Plus, Fuel as FuelIcon, Trash2, Edit3, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

interface FuelProps {
  fuelRecords: FuelRecord[];
  setFuelRecords: (records: FuelRecord[]) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  showToast: (msg: string) => void;
}

export const Fuel: React.FC<FuelProps> = ({ fuelRecords, setFuelRecords, expenses, setExpenses, showToast }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);
  const [formData, setFormData] = useState<Partial<FuelRecord>>({
    date: getTodayDateString(),
    startKm: '', endKm: '', liters: '', fuelPrice: '', totalFuelCost: ''
  });

  const avgConsumption = useMemo(() => {
    if (fuelRecords.length === 0) return 0;
    const total = fuelRecords.reduce((acc, r) => acc + r.consumption, 0);
    return total / fuelRecords.length;
  }, [fuelRecords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseFloat(formData.endKm || '0') - parseFloat(formData.startKm || '0');
    const liters = parseFloat(formData.liters || '0');
    const consumption = km / liters;
    const totalCost = liters * parseFloat(formData.fuelPrice || '0');
    
    const payload = { 
      ...formData, 
      id: editing?.id || generateId(),
      consumption,
      totalFuelCost: totalCost.toFixed(2)
    } as FuelRecord;

    if (editing) {
      setFuelRecords(fuelRecords.map(r => r.id === editing.id ? payload : r));
      setExpenses(expenses.map(ex => ex.linkedFuelId === editing.id ? { ...ex, date: payload.date, amount: payload.totalFuelCost } : ex));
      showToast('Registro atualizado!');
    } else {
      const newId = generateId();
      setFuelRecords([...fuelRecords, { ...payload, id: newId }]);
      setExpenses([...expenses, { 
        id: generateId(), 
        date: payload.date, 
        description: '⛽ Abastecimento', 
        amount: payload.totalFuelCost, 
        linkedFuelId: newId 
      }]);
      showToast('Abastecimento registrado!');
    }
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6 text-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-6 rounded-3xl text-amber-400 border border-amber-500/20 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="opacity-80" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60">Consumo Médio</p>
          </div>
          <p className="text-3xl font-bold">{avgConsumption.toFixed(2)} <span className="text-lg font-light text-white/50">km/L</span></p>
        </div>
        <div className="glass-card p-6 md:col-span-2 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light">Histórico de Abastecimento</h3>
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mt-1">Desempenho do Veículo</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus size={18} /> Novo Abastecimento
          </Button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Data</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">KM (Ini/Fim)</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Litros</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Consumo</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">Total</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {fuelRecords.map(r => (
              <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium">{formatDate(r.date)}</td>
                <td className="px-6 py-4 text-sm text-white/60">{r.startKm} → {r.endKm}</td>
                <td className="px-6 py-4 text-sm text-white/60">{r.liters}L <span className="text-[10px] text-white/20 font-bold ml-1">({formatCurrency(parseFloat(r.fuelPrice))}/L)</span></td>
                <td className="px-6 py-4 text-sm font-bold text-amber-400">{r.consumption.toFixed(2)} km/L</td>
                <td className="px-6 py-4 text-sm font-bold text-right text-white">{formatCurrency(parseFloat(r.totalFuelCost))}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(r); setFormData(r); setModalOpen(true); }} className="p-2 opacity-30 hover:text-accent-cyan transition hover:opacity-100"><Edit3 size={18} /></button>
                    <button onClick={() => { if(confirm('Excluir?')) { setFuelRecords(fuelRecords.filter(x => x.id !== r.id)); setExpenses(expenses.filter(e => e.linkedFuelId !== r.id)); } }} className="p-2 opacity-30 hover:text-rose-400 transition hover:opacity-100"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative glass-card w-full max-w-xl p-8">
              <h2 className="text-xl font-light mb-6">{editing ? 'Editar Abastecimento' : 'Novo Abastecimento'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Data</label>
                  <input type="date" required className="input-primary" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">KM Inicial</label>
                    <input type="number" required className="input-primary" value={formData.startKm} onChange={e => setFormData({...formData, startKm: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">KM Final</label>
                    <input type="number" required className="input-primary" value={formData.endKm} onChange={e => setFormData({...formData, endKm: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Litros</label>
                    <input type="number" step="0.01" required className="input-primary" value={formData.liters} onChange={e => setFormData({...formData, liters: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Preço por Litro (R$)</label>
                    <input type="number" step="0.01" required className="input-primary" value={formData.fuelPrice} onChange={e => setFormData({...formData, fuelPrice: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar Registro</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
