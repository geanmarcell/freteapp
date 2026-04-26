import React from 'react';
import { LayoutDashboard, Truck, Users, Fuel, Wallet, Menu, X, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCalculator: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onOpenCalculator }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'rides', label: 'Corridas & Fretes', icon: Truck },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'fuel', label: 'Combustível', icon: Fuel },
    { id: 'expenses', label: 'Despesas', icon: Wallet },
    { id: 'freight_calculator', label: 'Calculadora de Frete', icon: Calculator },
  ];

  return (
    <div className="min-h-screen flex text-white">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 glass-sidebar sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-cyan to-accent-purple rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent-cyan/20">
                <Truck size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-widest text-white">FRETE <span className="text-accent-cyan">PRO</span></h1>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  activeTab === item.id 
                    ? "bg-white/10 text-white border border-white/10 shadow-xl" 
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <p className="text-[10px] text-white/30 text-center leading-relaxed font-medium">
            © 2026 Frete App PRO • Desenvolvido por Gean Marcell •
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-cyan to-accent-purple rounded-lg flex items-center justify-center text-white">
            <Truck size={18} />
          </div>
          <span className="font-bold tracking-wider text-white">FRETE PRO</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 z-40 bg-[var(--bg-main)]/95 backdrop-blur-2xl pt-20 px-4"
          >
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-bold transition-all",
                    activeTab === item.id 
                      ? "bg-white/10 text-white border border-white/10 shadow-xl" 
                      : "text-white/50 hover:bg-white/5"
                  )}
                >
                  <item.icon size={24} />
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-12 pt-20 lg:pt-12 overflow-x-hidden">
        <div className="w-full">
          <header className="mb-10">
            <h2 className="text-3xl font-light mb-2 text-white">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-white/50 text-sm">Monitoramento e gestão em tempo real.</p>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
};
