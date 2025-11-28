'use client';

import { LayoutDashboard, TrendingUp, Truck, DollarSign, Package, Bell, Menu } from 'lucide-react';
import KPICard from '@/components/KPICard';
import SalesChart from '@/components/SalesChart';
import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      {/* Navbar / Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
              <LayoutDashboard className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none tracking-tight">SGA</h1>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">Torre de Control</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              {/* Weather Widget is now in the main content area per request context, but keeping a small one here or removing it? 
                   The user asked for the text "Hola Santiago..." to include the temperature. 
                   I will move the main weather display to the hero section. */}
            </div>

            <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700 dark:text-white">Santiago</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Administrador</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-800">
                S
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Hero / Welcome Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          {/* Decorative background blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2">
                Hola Santiago, la temperatura hoy en Molinari es:
              </h2>
              <div className="mt-4">
                <WeatherWidget />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/carga-camioneta" className="group bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3">
                <div className="bg-white dark:bg-slate-600 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Truck size={20} className="text-blue-500 dark:text-blue-400" />
                </div>
                Cargar Camioneta
              </Link>
              <Link href="/punto-venta" className="group bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-1 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                  <DollarSign size={20} />
                </div>
                Nueva Venta
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Ventas del Día"
            value="$ 1,250,000"
            icon={DollarSign}
            trend="+12.5%"
            trendUp={true}
            color="green"
          />
          <KPICard
            title="Margen Neto"
            value="10.2%"
            icon={TrendingUp}
            trend="-0.5%"
            trendUp={false}
            color="blue"
          />
          <KPICard
            title="Stock en Calle"
            value="450 Maples"
            icon={Truck}
            color="orange"
          />
          <KPICard
            title="Mermas (Roturas)"
            value="12 Unidades"
            icon={Package}
            color="red"
          />
        </div>

        {/* Charts & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <SalesChart />
          </div>

          {/* Alerts Panel */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Alertas Operativas</h3>
              <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-1 rounded-full animate-pulse">2 Nuevas</span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-red-200 dark:hover:border-red-900/50 transition-all cursor-pointer group">
                <div className="mt-1 p-2.5 bg-white dark:bg-slate-800 rounded-xl text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                  <Package size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">Stock Crítico: Fiorino</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Quedan menos de 10 maples de Huevo Grande.</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Hace 15 min</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-yellow-200 dark:hover:border-yellow-900/50 transition-all cursor-pointer group">
                <div className="mt-1 p-2.5 bg-white dark:bg-slate-800 rounded-xl text-yellow-500 shadow-sm group-hover:scale-110 transition-transform">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">Mantenimiento Requerido</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Boxer debe realizar cambio de aceite en 500km.</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Hace 2 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
