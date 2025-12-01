'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Truck, DollarSign, Package, Warehouse } from 'lucide-react';
import KPICard from '@/components/KPICard';
import SalesChart from '@/components/SalesChart';
import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';
import Header from '@/components/Header';
import api from '@/lib/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    ventasDia: 0,
    margenNeto: 0,
    vehiculosEnRuta: 0,
    mermasCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch Financial Report for Today
        const financieroRes = await api.get(`/reportes/financiero?inicio=${today}&fin=${today}`);
        const financiero = financieroRes.data;

        // Fetch Stock en Calle to count vehicles
        const stockRes = await api.get('/reportes/stock-calle');
        const stock = stockRes.data;
        const enRuta = stock.filter((v: any) => v.enRuta).length;

        // Fetch Mermas (maybe count recent ones? or just link)
        // For now we just link, maybe fetch count later if needed

        setStats({
          ventasDia: financiero.totalVentas,
          margenNeto: financiero.margenGananciaPorcentaje,
          vehiculosEnRuta: enRuta,
          mermasCount: 0 // Placeholder
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      {/* Navbar / Header */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Hero / Welcome Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
          {/* Decorative background blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                Hola Santiago
                <span className="block text-xl md:text-2xl font-medium text-slate-500 dark:text-slate-400 mt-1">
                  la temperatura hoy en Molinari es:
                </span>
              </h2>
              <div>
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

              <Link href="/inventario-general" className="group bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3">
                <div className="bg-white dark:bg-slate-600 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Warehouse size={20} className="text-blue-500 dark:text-blue-400" />
                </div>
                Cargar Inv. General
              </Link>

              <Link href="/punto-venta" className="group bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-1 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                  <DollarSign size={20} />
                </div>
                Nueva Venta
              </Link>

              <Link href="/simulacion-ventas" className="group bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-1 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                  <Package size={20} />
                </div>
                Simulación Ventas
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Ventas del Día"
            value={`$ ${stats.ventasDia.toLocaleString()}`}
            icon={DollarSign}
            trend="+12.5%"
            trendUp={true}
            color="green"
          />
          <KPICard
            title="Margen Neto"
            value={`${stats.margenNeto.toFixed(1)}%`}
            icon={TrendingUp}
            trend="-0.5%"
            trendUp={false}
            color="blue"
          />
          <KPICard
            title="Stock en Calle"
            value={`${stats.vehiculosEnRuta} En Ruta`}
            icon={Truck}
            color="orange"
            href="/stock-calle"
          />
          <KPICard
            title="Mermas (Roturas)"
            value="Ver Historial"
            icon={Package}
            color="red"
            href="/mermas"
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
