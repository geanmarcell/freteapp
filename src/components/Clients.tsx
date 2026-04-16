import React, { useState } from 'react';
import { Client } from '../types';
import { generateId } from '../lib/utils';
import { Plus, Search, Trash2, Edit3, User, Phone, MapPin, Building2 } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  showToast: (msg: string) => void;
}

export const Clients: React.FC<ClientsProps> = ({ clients, setClients, showToast }) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({
    empresa: '', nome: '', endereco: '', cidade: '', estado: '', telefone: '', observacao: ''
  });

  const filtered = clients.filter(c => 
    c.empresa.toLowerCase().includes(search.toLowerCase()) || 
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, id: editing?.id || generateId() } as Client;
    if (editing) {
      setClients(clients.map(c => c.id === editing.id ? payload : c));
      showToast('Cliente atualizado!');
    } else {
      setClients([...clients, payload]);
      showToast('Cliente cadastrado!');
    }
    setModalOpen(false);
    setEditing(null);
    setFormData({ empresa: '', nome: '', endereco: '', cidade: '', estado: '', telefone: '', observacao: '' });
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por empresa ou nome..." 
            className="input-primary pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus size={18} /> Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(client => (
          <motion.div 
            layout
            key={client.id}
            className="glass-card p-6 hover:bg-white/10 transition-colors group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-accent-cyan border border-white/10">
                <Building2 size={24} />
              </div>
              <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button 
                  type="button"
                  onClick={() => { setEditing(client); setFormData(client); setModalOpen(true); }} 
                  className="p-2 text-accent-cyan lg:text-white/30 lg:hover:text-accent-cyan transition"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setClients(clients.filter(c => c.id !== client.id));
                    showToast('Cliente removido!');
                  }} 
                  className="p-2 text-rose-400 lg:text-white/30 lg:hover:text-rose-400 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold mb-1 text-white">{client.empresa}</h3>
            <p className="text-sm text-white/50 mb-4 flex items-center gap-1.5"><User size={14} /> {client.nome}</p>
            
            <div className="space-y-2 pt-4 border-t border-white/5">
              <p className="text-sm text-white/70 flex items-center gap-2"><Phone size={14} className="opacity-20" /> {client.telefone}</p>
              <p className="text-sm text-white/70 flex items-center gap-2"><MapPin size={14} className="opacity-20" /> {client.cidade} - {client.estado}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative glass-card w-full max-w-xl p-8">
              <h2 className="text-xl font-light mb-6">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Empresa</label>
                    <input type="text" required className="input-primary" value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Nome do Contato</label>
                    <input type="text" required className="input-primary" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Telefone</label>
                  <input type="text" required className="input-primary" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Cidade</label>
                    <input type="text" required className="input-primary" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Estado</label>
                    <input type="text" required maxLength={2} className="input-primary" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value.toUpperCase()})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Endereço</label>
                  <input type="text" className="input-primary" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Observações</label>
                  <textarea rows={2} className="input-primary" value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar Cliente</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
