import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { generateId, formatCurrency, formatDate, getTodayDateString } from '../lib/utils';
import { Plus, Wallet, Trash2, Edit3, Filter } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

interface ExpensesProps {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  showToast: (msg: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, setExpenses, showToast }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: getTodayDateString(),
    description: '',
    amount: '',
    currentKm: ''
  });

  const total = useMemo(() => expenses.reduce((acc, e) => acc + parseFloat(e.amount || '0'), 0), [expenses]);

  const handleDelete = (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir esta despesa?');
    if (confirmed) {
      setExpenses(expenses.filter(x => x.id !== id));
      showToast('Despesa excluída com sucesso!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...formData, 
      id: editing?.id || generateId(),
      amount: parseFloat(formData.amount || '0').toFixed(2)
    } as Expense;

    if (editing) {
      setExpenses(expenses.map(e => e.id === editing.id ? payload : e));
      showToast('Despesa atualizada!');
    } else {
      setExpenses([...expenses, payload]);
      showToast('Despesa registrada!');
    }
    setModalOpen(false);
    setEditing(null);
    setFormData({ date: getTodayDateString(), description: '', amount: '', currentKm: '' });
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/20 px-6 py-4 rounded-3xl border border-rose-500/20 backdrop-blur-xl shadow-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-rose-400 border border-white/10">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total de Despesas</p>
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus size={18} /> Nova Despesa
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Data</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Descrição</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">KM</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">Valor</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
              <tr key={e.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium">{formatDate(e.date)}</td>
                <td className="px-6 py-4 text-sm text-white/60">
                  {e.description}
                  {e.linkedFuelId && <span className="ml-2 text-[10px] bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Automático</span>}
                </td>
                <td className="px-6 py-4 text-sm text-white/40 text-right">
                  {e.currentKm ? `${e.currentKm} km` : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-rose-400 text-right">{formatCurrency(parseFloat(e.amount))}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    {!e.linkedFuelId && (
                      <button 
                        type="button"
                        onClick={() => { setEditing(e); setFormData(e); setModalOpen(true); }} 
                        className="p-2 text-accent-cyan lg:opacity-30 lg:hover:opacity-100 transition"
                      >
                        <Edit3 size={18} />
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => {
                        setExpenses(expenses.filter(x => x.id !== e.id));
                        showToast('Despesa excluída!');
                      }} 
                      className="p-2 text-rose-400 lg:opacity-30 lg:hover:opacity-100 transition"
                    >
                      <Trash2 size={18} />
                    </button>
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative glass-card w-full max-w-md p-8">
              <h2 className="text-xl font-light mb-6">{editing ? 'Editar Despesa' : 'Nova Despesa'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Data</label>
                  <input type="date" required className="input-primary" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Descrição</label>
                  <input type="text" required placeholder="Ex: Alimentação, Manutenção..." className="input-primary" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Valor (R$)</label>
                    <input type="number" step="0.01" required className="input-primary" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Kilometragem Atual (Opcional)</label>
                    <input type="number" placeholder="Ex: 15400" className="input-primary" value={formData.currentKm || ''} onChange={e => setFormData({...formData, currentKm: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar Despesa</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
