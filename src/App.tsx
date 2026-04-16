/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Rides } from './components/Rides';
import { Clients } from './components/Clients';
import { Fuel } from './components/Fuel';
import { Expenses } from './components/Expenses';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Ride, Client, FuelRecord, Expense } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Ensure dark mode is always active
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
  }, []);

  const [rides, setRides] = useLocalStorage<Ride[]>('rides', []);
  const [clients, setClients] = useLocalStorage<Client[]>('clients', []);
  const [fuelRecords, setFuelRecords] = useLocalStorage<FuelRecord[]>('fuelRecords', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard rides={rides} expenses={expenses} fuelRecords={fuelRecords} />;
      case 'rides':
        return <Rides rides={rides} setRides={setRides} clients={clients} showToast={showToast} />;
      case 'clients':
        return <Clients clients={clients} setClients={setClients} showToast={showToast} />;
      case 'fuel':
        return <Fuel fuelRecords={fuelRecords} setFuelRecords={setFuelRecords} expenses={expenses} setExpenses={setExpenses} showToast={showToast} />;
      case 'expenses':
        return <Expenses expenses={expenses} setExpenses={setExpenses} showToast={showToast} />;
      default:
        return <Dashboard rides={rides} expenses={expenses} fuelRecords={fuelRecords} />;
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Layout>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white"
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="text-emerald-400" size={20} />
            ) : (
              <XCircle className="text-rose-400" size={20} />
            )}
            <span className="font-semibold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
