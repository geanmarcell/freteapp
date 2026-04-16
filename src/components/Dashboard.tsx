import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { Ride, Expense, FuelRecord } from '../types';
import { PLATFORMS } from '../constants';
import { formatCurrency, getTodayDateString } from '../lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Truck, Fuel, Wallet, Download, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  rides: Ride[];
  expenses: Expense[];
  fuelRecords: FuelRecord[];
}

const COLORS = ['#00f2fe', '#8942ff', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export const Dashboard: React.FC<DashboardProps> = ({ rides, expenses, fuelRecords }) => {
  const [timeFilter, setTimeFilter] = React.useState<'daily' | 'monthly' | 'yearly' | 'all'>('monthly');
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    rides.forEach(r => years.add(new Date(r.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [rides]);

  const filteredData = useMemo(() => {
    const today = getTodayDateString();
    const currentMonth = today.substring(0, 7);

    const filterFn = (item: { date: string }) => {
      if (timeFilter === 'daily') return item.date === today;
      if (timeFilter === 'monthly') return item.date.startsWith(currentMonth);
      if (timeFilter === 'yearly') return item.date.startsWith(selectedYear.toString());
      return true;
    };

    return {
      rides: rides.filter(filterFn),
      expenses: expenses.filter(filterFn),
      fuelRecords: fuelRecords.filter(filterFn)
    };
  }, [rides, expenses, fuelRecords, timeFilter, selectedYear]);

  const stats = useMemo(() => {
    const totalRevenue = filteredData.rides.reduce((acc, r) => acc + parseFloat(r.netValue || '0'), 0);
    const totalExpenses = filteredData.expenses.reduce((acc, e) => acc + parseFloat(e.amount || '0'), 0);
    const totalFuel = filteredData.fuelRecords.reduce((acc, f) => acc + parseFloat(f.totalFuelCost || '0'), 0);
    const totalKM = filteredData.rides.reduce((acc, r) => acc + parseFloat(r.distance || '0'), 0);
    const totalLiters = filteredData.fuelRecords.reduce((acc, f) => acc + parseFloat(f.liters || '0'), 0);
    
    const balance = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (balance / totalRevenue) * 100 : 0;
    const efficiency = totalLiters > 0 ? totalKM / totalLiters : 0;
    const revenuePerKM = totalKM > 0 ? totalRevenue / totalKM : 0;
    
    return { totalRevenue, totalExpenses, balance, margin, totalFuel, totalKM, efficiency, revenuePerKM };
  }, [filteredData]);

  const maintenance = useMemo(() => {
    const lastFuelKM = fuelRecords.length > 0 ? Math.max(...fuelRecords.map(f => parseFloat(f.endKm || '0'))) : 0;
    const lastExpenseKM = expenses.length > 0 ? Math.max(...expenses.map(e => parseFloat(e.currentKm || '0'))) : 0;
    
    // Use the highest odometer reading found across fuel and general expenses
    const currentKM = Math.max(lastFuelKM, lastExpenseKM);
    
    // Simple logic: Oil change every 10k KM
    const nextOilChange = Math.ceil((currentKM + 1) / 10000) * 10000;
    const kmToOil = nextOilChange - currentKM;
    
    return { currentKM, kmToOil, nextOilChange };
  }, [rides, fuelRecords, expenses]);

  const exportToCSV = () => {
    const headers = ['Data', 'Plataforma', 'Valor Liquido', 'KM Inicial', 'KM Final'];
    const rows = filteredData.rides.map(r => [r.date, r.platform, r.netValue, r.initialKM, r.finalKM]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${timeFilter}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const taxStats = useMemo(() => {
    const prevYear = new Date().getFullYear() - 1;
    const prevYearStr = prevYear.toString();
    
    const yearRides = rides.filter(r => r.date.startsWith(prevYearStr));
    const yearExpenses = expenses.filter(e => e.date.startsWith(prevYearStr));
    
    const revenue = yearRides.reduce((acc, r) => acc + parseFloat(r.netValue || '0'), 0);
    const expense = yearExpenses.reduce((acc, e) => acc + parseFloat(e.amount || '0'), 0);
    const balance = revenue - expense;
    
    return { revenue, expense, balance, year: prevYear };
  }, [rides, expenses]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { name: string; receita: number; despesa: number }> = {};
    
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('pt-BR', { month: 'short' });
      data[key] = { name, receita: 0, despesa: 0 };
    }

    filteredData.rides.forEach(r => {
      const key = r.date.substring(0, 7);
      if (data[key]) data[key].receita += parseFloat(r.netValue || '0');
    });

    filteredData.expenses.forEach(e => {
      const key = e.date.substring(0, 7);
      if (data[key]) data[key].despesa += parseFloat(e.amount || '0');
    });

    return Object.values(data);
  }, [filteredData]);

  const platformStats = useMemo(() => {
    const stats: Record<string, { name: string; count: number; revenue: number }> = {};
    filteredData.rides.forEach(r => {
      if (!stats[r.platform]) {
        stats[r.platform] = { 
          name: PLATFORMS.find(p => p.id === r.platform)?.name || r.platform, 
          count: 0, 
          revenue: 0 
        };
      }
      stats[r.platform].count += 1;
      stats[r.platform].revenue += parseFloat(r.netValue || '0');
    });
    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-white">
      {/* Filter UI */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-light">Resumo Operacional</h2>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70 transition"
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
        <div className="flex items-center gap-3">
          {timeFilter === 'yearly' && (
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-accent-cyan transition text-white"
            >
              {availableYears.map(year => (
                <option key={year} value={year} className="bg-slate-900 text-white">{year}</option>
              ))}
            </select>
          )}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {(['daily', 'monthly', 'yearly', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition ${
                  timeFilter === f 
                    ? 'bg-white/10 text-accent-cyan shadow-sm' 
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {f === 'daily' ? 'Hoje' : f === 'monthly' ? 'Mês' : f === 'yearly' ? 'Ano' : 'Tudo'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Receita Total" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={TrendingUp} 
          color="text-accent-cyan" 
        />
        <StatsCard 
          title="Despesas Totais" 
          value={formatCurrency(stats.totalExpenses)} 
          icon={TrendingDown} 
          color="text-rose-400" 
        />
        <StatsCard 
          title="Saldo Líquido" 
          value={formatCurrency(stats.balance)} 
          icon={DollarSign} 
          color={stats.balance >= 0 ? "text-emerald-400" : "text-amber-400"} 
        />
        <StatsCard 
          title="Margem de Lucro" 
          value={`${stats.margin.toFixed(1)}%`} 
          icon={Wallet} 
          color="text-accent-purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-white/50">Fluxo de Caixa (6 Meses)</h3>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8942ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8942ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="receita" stroke="#00f2fe" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" name="Receita" />
                  <Area type="monotone" dataKey="despesa" stroke="#8942ff" strokeWidth={3} fillOpacity={1} fill="url(#colorDes)" name="Despesa" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-white/50">Receita por Plataforma</h3>
          <div className="h-[300px] w-full flex items-center">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformStats.map(s => ({ name: s.name, value: s.revenue }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {platformStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend iconType="square" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Platform Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Desempenho por Aplicativo</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-500/5 border-b border-slate-500/5">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-50">Plataforma</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-50 text-center">Qtd.</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">Ganhos</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/5">
                {platformStats.map((s, idx) => (
                  <tr key={s.name} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-sm font-medium">{s.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm opacity-70 text-center font-mono">{s.count}</td>
                    <td className="px-6 py-4 text-sm font-bold text-accent-cyan text-right">{formatCurrency(s.revenue)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-bold opacity-40">
                          {stats.totalRevenue > 0 ? ((s.revenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Income Tax Info (Carnê-Leão) */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="text-accent-purple" size={20} />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Dados para IRPF {taxStats.year}</h3>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="p-4 bg-slate-500/5 rounded-2xl border border-slate-500/5">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Rendimento Bruto ({taxStats.year})</p>
              <p className="text-xl font-bold">{formatCurrency(taxStats.revenue)}</p>
              <p className="text-[9px] opacity-40 mt-2 leading-relaxed">
                * Motoristas de aplicativo podem tributar apenas 60% do rendimento bruto no transporte de passageiros.
              </p>
            </div>

            <div className="p-4 bg-slate-500/5 rounded-2xl border border-slate-500/5">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Despesas Dedutíveis ({taxStats.year})</p>
              <p className="text-xl font-bold text-rose-400">{formatCurrency(taxStats.expense)}</p>
              <p className="text-[9px] opacity-40 mt-2 leading-relaxed">
                * Apenas despesas essenciais à atividade (combustível, manutenção) são dedutíveis no Livro Caixa.
              </p>
            </div>

            <div className="p-4 bg-accent-cyan/10 rounded-2xl border border-accent-cyan/20">
              <p className="text-[10px] font-bold text-accent-cyan uppercase tracking-widest mb-1">Base de Cálculo Estimada</p>
              <p className="text-xl font-bold">{formatCurrency(Math.max(0, taxStats.balance))}</p>
              <p className="text-[9px] opacity-40 mt-2 font-medium">
                Valor líquido consolidado de {taxStats.year} para o IRPF.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-500/5 dark:border-white/5">
            <p className="text-[10px] opacity-30 italic text-center">
              Consulte um contador para validação dos dados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.02 }}
    className="glass-card p-6 flex items-center gap-4"
  >
    <div className={`p-3 rounded-xl bg-slate-500/5 ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </motion.div>
);
