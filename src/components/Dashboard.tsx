import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Ride, Expense, FuelRecord, Client } from '../types';
import { PLATFORMS } from '../constants';
import { formatCurrency, getTodayDateString, formatDate } from '../lib/utils';
import { 
  TrendingUp, TrendingDown, DollarSign, Truck, Fuel, Wallet, Download, 
  Activity, AlertTriangle, Clock, Navigation, Zap, BarChart3, LineChart as LucideLineChart,
  Save, Upload, FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  rides: Ride[];
  expenses: Expense[];
  fuelRecords: FuelRecord[];
  clients: Client[];
  setRides: (rides: Ride[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setFuelRecords: (records: FuelRecord[]) => void;
  setClients: (clients: Client[]) => void;
  showToast: (msg: string) => void;
}

const COLORS = ['#00f2fe', '#8942ff', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  rides, expenses, fuelRecords, clients,
  setRides, setExpenses, setFuelRecords, setClients, showToast
}) => {
  const [timeFilter, setTimeFilter] = React.useState<'daily' | 'monthly' | 'yearly' | 'all'>('monthly');
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [isMounted, setIsMounted] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    const totalRides = filteredData.rides.length;
    
    // Group rides by date to calculate daily working hours (span between first and last ride)
    const ridesByDate: Record<string, string[]> = {};
    filteredData.rides.forEach(r => {
      if (!ridesByDate[r.date]) ridesByDate[r.date] = [];
      ridesByDate[r.date].push(r.time);
    });

    let totalHours = 0;
    Object.values(ridesByDate).forEach(times => {
      if (times.length > 1) {
        const sorted = [...times].sort();
        const start = sorted[0];
        const end = sorted[sorted.length - 1];
        
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        
        const diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        totalHours += diffMinutes / 60;
      } else if (times.length === 1) {
        // Fallback for single ride days: use the average duration of trips or a default
        const ride = filteredData.rides.find(r => r.time === times[0]);
        totalHours += (parseFloat(ride?.duration || '30') / 60);
      }
    });
    
    const balance = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (balance / totalRevenue) * 100 : 0;
    const efficiency = totalLiters > 0 ? totalKM / totalLiters : 0;
    
    // Revenue metrics
    const revPerRide = totalRides > 0 ? totalRevenue / totalRides : 0;
    const revPerHour = totalHours > 0 ? totalRevenue / totalHours : 0;
    const revPerKM = totalKM > 0 ? totalRevenue / totalKM : 0;
    
    // Cost metrics
    const costPerRide = totalRides > 0 ? totalExpenses / totalRides : 0;
    const costPerHour = totalHours > 0 ? totalExpenses / totalHours : 0;
    const costPerKM = totalKM > 0 ? totalExpenses / totalKM : 0;
    
    // Profit metrics
    const profitPerRide = totalRides > 0 ? balance / totalRides : 0;
    const profitPerHour = totalHours > 0 ? balance / totalHours : 0;
    const profitPerKM = totalKM > 0 ? balance / totalKM : 0;
    
    return { 
      totalRevenue, totalExpenses, balance, margin, totalFuel, totalKM, efficiency, 
      totalRides, totalHours,
      revPerRide, revPerHour, revPerKM,
      costPerRide, costPerHour, costPerKM,
      profitPerRide, profitPerHour, profitPerKM
    };
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

  const weeklyData = useMemo(() => {
    const getWeek = (date: Date) => {
      const oneJan = new Date(date.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
    };

    const weeks: Record<string, { week: number; revenue: number; profit: number; hours: number; performance: number; dates: Record<string, string[]> }> = {};
    
    // Process last 8 weeks
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - (i * 7));
      const w = getWeek(d);
      const year = d.getFullYear();
      const key = `${year}-W${w}`;
      weeks[key] = { week: w, revenue: 0, profit: 0, hours: 0, performance: 0, dates: {} };
    }

    filteredData.rides.forEach(r => {
      const d = new Date(r.date);
      const w = getWeek(d);
      const key = `${d.getFullYear()}-W${w}`;
      if (weeks[key]) {
        const rev = parseFloat(r.netValue || '0');
        weeks[key].revenue += rev;
        weeks[key].profit += rev;
        
        // Track times per date within the week
        if (!weeks[key].dates[r.date]) weeks[key].dates[r.date] = [];
        weeks[key].dates[r.date].push(r.time);
      }
    });

    // Calculate hours for each week based on daily spans
    Object.keys(weeks).forEach(key => {
      Object.entries(weeks[key].dates).forEach(([date, times]) => {
        if (times.length > 1) {
          const sorted = [...times].sort();
          const [h1, m1] = sorted[0].split(':').map(Number);
          const [h2, m2] = sorted[sorted.length - 1].split(':').map(Number);
          weeks[key].hours += ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
        } else if (times.length === 1) {
          const ride = filteredData.rides.find(r => r.date === date && r.time === times[0]);
          weeks[key].hours += (parseFloat(ride?.duration || '30') / 60);
        }
      });
    });

    filteredData.expenses.forEach(e => {
      const d = new Date(e.date);
      const w = getWeek(d);
      const key = `${d.getFullYear()}-W${w}`;
      if (weeks[key]) {
        weeks[key].profit -= parseFloat(e.amount || '0');
      }
    });

    return Object.values(weeks).map(w => ({
      name: `S${w.week}`,
      faturamento: w.revenue,
      performance: w.hours > 0 ? (w.revenue / w.hours) : 0,
    }));
  }, [filteredData]);

  const expenseBreakdown = useMemo(() => {
    const breakdown: Record<string, { type: string; amount: number }> = {};
    const totalRev = stats.totalRevenue;
    const totalExp = stats.totalExpenses;

    filteredData.expenses.forEach(e => {
      const type = e.description || 'Outros';
      if (!breakdown[type]) breakdown[type] = { type, amount: 0 };
      breakdown[type].amount += parseFloat(e.amount || '0');
    });

    return Object.values(breakdown).map(b => ({
      ...b,
      percentOfTotal: totalExp > 0 ? (b.amount / totalExp) * 100 : 0,
      percentOfRevenue: totalRev > 0 ? (b.amount / totalRev) * 100 : 0,
    }));
  }, [filteredData, stats.totalExpenses, stats.totalRevenue]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("FRETE APP PRO", 14, 25);
    doc.setFontSize(10);
    doc.text(`RELATÓRIO OPERACIONAL | ${timeFilter.toUpperCase()} | ${selectedYear}`, 14, 32);
    
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 145, 32);

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("RESUMO FINANCEIRO", 14, 55);
    
    const summaryData = [
      ['Total de Receita', formatCurrency(stats.totalRevenue)],
      ['Total de Despesas', formatCurrency(stats.totalExpenses)],
      ['Saldo Líquido', formatCurrency(stats.balance)],
      ['Margem de Lucro', `${stats.margin.toFixed(1)}%`]
    ];

    autoTable(doc, {
      startY: 60,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [0, 242, 254] },
    });

    // Sub-summary
    const finalY1 = (doc as any).lastAutoTable.finalY + 15;
    doc.text("MÉTRICAS OPERACIONAIS", 14, finalY1);
    
    const operationalData = [
      ['Total de Viagens', stats.totalRides.toString()],
      ['Horas Logado', `${stats.totalHours.toFixed(1)}h`],
      ['KM Rodado', `${stats.totalKM.toFixed(0)} km`],
      ['Fat / KM', formatCurrency(stats.revPerKM)]
    ];

    autoTable(doc, {
      startY: finalY1 + 5,
      head: [['Métrica', 'Conteúdo']],
      body: operationalData,
      theme: 'grid',
    });

    // Rides Table
    const finalY2 = (doc as any).lastAutoTable.finalY + 15;
    doc.text("DETALHAMENTO DE VIAGENS", 14, finalY2);
    
    const ridesTable = filteredData.rides.map(r => [
      formatDate(r.date),
      PLATFORMS.find(p => p.id === r.platform)?.name || r.platform,
      r.origin || r.pickupAddress || '-',
      r.destination || r.deliveryAddress || '-',
      formatCurrency(parseFloat(r.netValue))
    ]);

    autoTable(doc, {
      startY: finalY2 + 5,
      head: [['Data', 'Plataforma', 'Origem', 'Destino', 'Valor']],
      body: ridesTable,
      styles: { fontSize: 8 },
    });

    doc.save(`relatorio_${timeFilter}_${selectedYear}.pdf`);
    showToast('PDF gerado com sucesso!');
  };

  const handleBackup = () => {
    const backupData = {
      rides,
      expenses,
      fuelRecords,
      clients,
      version: '1.0',
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_freteapp_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup criado com sucesso!');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.rides && data.expenses && data.fuelRecords) {
          if (window.confirm('Isso substituirá todos os seus dados atuais. Deseja continuar?')) {
            setRides(data.rides);
            setExpenses(data.expenses);
            setFuelRecords(data.fuelRecords);
            setClients(data.clients || []);
            showToast('Dados restaurados com sucesso!');
          }
        } else {
          showToast('Formato de arquivo inválido.', 'error');
        }
      } catch (err) {
        showToast('Erro ao ler arquivo de backup.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const taxStats = useMemo(() => {
    const prevYear = new Date().getFullYear() - 1;
    const prevYearStr = prevYear.toString();
    
    const yearRides = rides.filter(r => r.date.startsWith(prevYearStr));
    const yearExpenses = expenses.filter(e => e.date.startsWith(prevYearStr));
    
    const revenue = yearRides.reduce((acc, r) => acc + parseFloat(r.netValue || '0'), 0);
    const expense = yearExpenses.reduce((acc, e) => acc + parseFloat(e.amount || '0'), 0);
    const balance = revenue - expense;
    
    // For app drivers, Valor a Declarar is usually 60% of gross revenue (simplified)
    const valorDeclarar = (revenue * 0.6) - expense;
    
    return { revenue, expense, balance, year: prevYear, valorDeclarar };
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
          <div className="flex gap-2">
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70 transition"
              title="Exportar para PDF"
            >
              <FileText size={14} className="text-rose-400" /> PDF
            </button>
            <div className="w-[1px] h-8 bg-white/5 mx-1" />
            <button 
              onClick={handleBackup}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70 transition"
              title="Criar Backup"
            >
              <Save size={14} className="text-accent-cyan" /> Backup
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70 transition"
              title="Restaurar Backup"
            >
              <Upload size={14} className="text-accent-purple" /> Restaurar
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleRestore} 
              accept=".json" 
              className="hidden" 
            />
          </div>
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

      {/* Financial Summary */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 ml-1">Resumo Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Receita Total" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} color="text-accent-cyan" />
          <StatsCard title="Despesas Totais" value={formatCurrency(stats.totalExpenses)} icon={TrendingDown} color="text-rose-400" />
          <StatsCard title="Saldo Líquido" value={formatCurrency(stats.balance)} icon={DollarSign} color={stats.balance >= 0 ? "text-emerald-400" : "text-amber-400"} />
          <StatsCard title="Margem de Lucro" value={`${stats.margin.toFixed(1)}%`} icon={Wallet} color="text-accent-purple" />
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 ml-1">Métricas Operacionais</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard title="Total Viagens" value={stats.totalRides} icon={Truck} color="text-accent-cyan" tiny />
          <StatsCard title="Horas Logado" value={`${stats.totalHours.toFixed(1)}h`} icon={Clock} color="text-accent-purple" tiny />
          <StatsCard title="KM Rodado" value={`${stats.totalKM.toFixed(0)} km`} icon={Navigation} color="text-amber-400" tiny />
          <StatsCard title="Fat / Viagem" value={formatCurrency(stats.revPerRide)} icon={DollarSign} color="text-emerald-400" tiny />
          <StatsCard title="Fat / Hora" value={formatCurrency(stats.revPerHour)} icon={Zap} color="text-accent-cyan" tiny />
          <StatsCard title="Fat / KM" value={formatCurrency(stats.revPerKM)} icon={BarChart3} color="text-accent-purple" tiny />
        </div>
      </div>

      {/* Productivity & Costs */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 ml-1">Produtividade e Custos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard title="Custo / Viagem" value={formatCurrency(stats.costPerRide)} icon={TrendingDown} color="text-rose-400" tiny />
          <StatsCard title="Custo / Hora" value={formatCurrency(stats.costPerHour)} icon={TrendingDown} color="text-rose-400" tiny />
          <StatsCard title="Custo / KM" value={formatCurrency(stats.costPerKM)} icon={TrendingDown} color="text-rose-400" tiny />
          <StatsCard title="Lucro / Viagem" value={formatCurrency(stats.profitPerRide)} icon={Activity} color="text-emerald-400" tiny />
          <StatsCard title="Lucro / Hora" value={formatCurrency(stats.profitPerHour)} icon={Activity} color="text-emerald-400" tiny />
          <StatsCard title="Lucro / KM" value={formatCurrency(stats.profitPerKM)} icon={Activity} color="text-emerald-400" tiny />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-white/50 flex items-center gap-2">
            <LucideLineChart size={16} /> Faturamento por Semana
          </h3>
          <div className="h-[250px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'rgba(255,255,255,0.4)'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'rgba(255,255,255,0.4)'}} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Line type="monotone" dataKey="faturamento" stroke="#00f2fe" strokeWidth={3} dot={{ r: 4, fill: '#00f2fe' }} activeDot={{ r: 6 }} name="Faturamento" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Performance Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-white/50 flex items-center gap-2">
            <BarChart3 size={16} /> Performance Semana (R$/Hora)
          </h3>
          <div className="h-[250px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'rgba(255,255,255,0.4)'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'rgba(255,255,255,0.4)'}} tickFormatter={(val) => `R$${val}/h`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                    formatter={(val: number) => `${formatCurrency(val)}/h`}
                  />
                  <Line type="monotone" dataKey="performance" stroke="#8942ff" strokeWidth={3} dot={{ r: 4, fill: '#8942ff' }} activeDot={{ r: 6 }} name="R$ por Hora" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

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

      {/* Expense Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card overflow-hidden lg:col-span-3">
          <div className="px-6 py-4 border-b border-white/5 bg-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Detalhamento de Despesas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-500/5 border-b border-slate-500/5">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-50">Tipo de Despesa</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">Valor</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">% vs Geral</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-50 text-right">% vs Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/5">
                {expenseBreakdown.map((b) => (
                  <tr key={b.type} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{b.type}</td>
                    <td className="px-6 py-4 text-sm font-bold text-rose-400 text-right">{formatCurrency(b.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold opacity-40">{b.percentOfTotal.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold opacity-40">{b.percentOfRevenue.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
                {expenseBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm opacity-30 italic">Nenhuma despesa registrada no período.</td>
                  </tr>
                )}
              </tbody>
            </table>
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

            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Valor a Declarar (Estimado)</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(Math.max(0, taxStats.valorDeclarar))}</p>
              <p className="text-[9px] opacity-40 mt-2 leading-relaxed">
                * Estimativa baseada na regra de 60% do rendimento bruto para transporte de passageiros.
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

const StatsCard = ({ title, value, icon: Icon, color, tiny }: any) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.02 }}
    className={`glass-card flex items-center gap-4 ${tiny ? 'p-3' : 'p-6'}`}
  >
    <div className={`rounded-xl bg-slate-500/5 ${color} ${tiny ? 'p-2' : 'p-3'}`}>
      <Icon size={tiny ? 18 : 24} />
    </div>
    <div>
      <p className={`font-bold text-white/50 uppercase tracking-widest ${tiny ? 'text-[8px]' : 'text-[10px]'}`}>{title}</p>
      <p className={`font-bold text-white ${tiny ? 'text-sm' : 'text-2xl'}`}>{value}</p>
    </div>
  </motion.div>
);
