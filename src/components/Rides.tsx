import React, { useState, useMemo } from 'react';
import { Ride, Client, PlatformId } from '../types';
import { PLATFORMS } from '../constants';
import { formatCurrency, formatDate, generateId, getTodayDateString } from '../lib/utils';
import { Plus, Search, Trash2, Edit3, Eye, Filter, ChevronLeft, ChevronRight, Truck, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';

interface RidesProps {
  rides: Ride[];
  setRides: (rides: Ride[]) => void;
  clients: Client[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const Rides: React.FC<RidesProps> = ({ rides, setRides, clients, showToast }) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ride | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'ride' | 'freight'>('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [formData, setFormData] = useState<Partial<Ride>>({
    date: getTodayDateString(),
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    platform: 'uber',
    type: 'ride',
    netValue: '',
    distance: '',
    duration: '',
    tips: '',
    notes: '',
  });

  const filtered = useMemo(() => {
    let res = [...rides].sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
    if (search) {
      const t = search.toLowerCase();
      res = res.filter(r => 
        r.clientName?.toLowerCase().includes(t)
      );
    }
    if (filterType !== 'all') res = res.filter(r => r.type === filterType);
    return res;
  }, [rides, search, filterType]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...formData, 
      id: editing?.id || generateId(),
    } as Ride;

    if (editing) {
      setRides(rides.map(r => r.id === editing.id ? payload : r));
      showToast('Registro atualizado!');
    } else {
      setRides([...rides, payload]);
      showToast('Registro adicionado!');
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientId: client.id,
        clientName: client.empresa,
        clientContact: client.telefone,
      }));
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou plataforma..." 
              className="input-primary pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-accent-cyan/50 text-white/70"
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <option value="all" className="bg-slate-900">Todos</option>
            <option value="ride" className="bg-slate-900">Corridas</option>
            <option value="freight" className="bg-slate-900">Fretes</option>
          </select>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="gap-2">
          <Plus size={18} /> Novo Registro
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Data/Hora</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Plataforma</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">R$/KM</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map(r => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">{formatDate(r.date)}</p>
                    <p className="text-xs text-white/40">{r.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      r.type === 'freight' ? 'bg-accent-cyan/10 text-accent-cyan' : 'bg-accent-purple/10 text-accent-purple'
                    }`}>
                      {r.type === 'freight' ? <Truck size={10} /> : <Car size={10} />}
                      {r.type === 'freight' ? 'Frete' : 'Corrida'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white/70">
                      {PLATFORMS.find(p => p.id === r.platform)?.name || r.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-accent-cyan">{formatCurrency(parseFloat(r.netValue))}</p>
                    <p className="text-[10px] text-white/30 uppercase font-bold">{r.distance} km</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      {parseFloat(r.distance) > 0 
                        ? formatCurrency(parseFloat(r.netValue) / parseFloat(r.distance)) 
                        : '-'}
                    </p>
                    <p className="text-[10px] text-white/30 uppercase font-bold">por km</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      {parseFloat(r.distance) > 0 
                        ? formatCurrency(parseFloat(r.netValue) / parseFloat(r.distance)) 
                        : '-'}
                    </p>
                    <p className="text-[10px] text-white/30 uppercase font-bold">por km</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => { setEditing(r); setFormData(r); setModalOpen(true); }} 
                        className="p-2 text-accent-cyan lg:opacity-30 lg:hover:opacity-100 transition"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setRides(rides.filter(x => x.id !== r.id));
                          showToast('Registro excluído!');
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
        
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs opacity-30 font-bold uppercase tracking-widest">Mostrando {paginated.length} de {filtered.length} registros</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></Button>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={16} /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md" onClick={() => setModalOpen(false)} 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative glass-card w-full max-w-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-light">{editing ? 'Editar Registro' : 'Novo Registro'}</h2>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  <button 
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition ${formData.type === 'ride' ? 'bg-white/10 text-accent-cyan shadow-sm' : 'opacity-30'}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'ride' }))}
                  >Corrida</button>
                  <button 
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition ${formData.type === 'freight' ? 'bg-white/10 text-accent-cyan shadow-sm' : 'opacity-30'}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'freight' }))}
                  >Frete</button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Data</label>
                    <input type="date" required className="input-primary" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Hora</label>
                    <input type="time" required className="input-primary" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Plataforma</label>
                    <select className="input-primary" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value as PlatformId})}>
                      {PLATFORMS.map(p => <option key={p.id} value={p.id} className="bg-[var(--bg-main)]">{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Distância (km)</label>
                    <input type="number" step="0.1" required className="input-primary" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Duração (minutos)</label>
                    <input type="number" required placeholder="Ex: 25" className="input-primary" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                  </div>
                </div>

                {formData.type === 'freight' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Cliente</label>
                      <select className="input-primary" onChange={e => handleClientSelect(e.target.value)}>
                        <option value="" className="bg-[var(--bg-main)]">Selecione um cliente...</option>
                        {clients.map(c => <option key={c.id} value={c.id} className="bg-[var(--bg-main)]">{c.empresa}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Valor Líquido (R$)</label>
                    <input type="number" step="0.01" required className="input-primary bg-accent-cyan/5" value={formData.netValue} onChange={e => setFormData({...formData, netValue: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gorjeta (R$)</label>
                    <input type="number" step="0.01" className="input-primary" value={formData.tips} onChange={e => setFormData({...formData, tips: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Observações</label>
                  <textarea rows={2} className="input-primary" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
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
