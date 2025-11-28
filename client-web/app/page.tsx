'use client';

import { LayoutDashboard, TrendingUp, Truck, DollarSign, Package, Bell, Menu } from 'lucide-react';
import KPICard from '@/components/KPICard';
import SalesChart from '@/components/SalesChart';
import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 bg-[url('/grid.svg')] bg-fixed">

      {/* Navbar / Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <LayoutDashboard className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">SGA</h1>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium tracking-wider">TORRE DE CONTROL</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <WeatherWidget />
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              S
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Hola, Santiago 👋
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              Aquí tienes el resumen operativo de hoy.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/carga-camioneta" className="group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-5 py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2">
              <Truck size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
              Cargar Camioneta
            </Link>
            <Link href="/punto-venta" className="group bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center gap-2">
              <DollarSign size={20} className="group-hover:rotate-12 transition-transform" />
              Nueva Venta
            </Link>
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
          <div className="lg:col-span-2">
            <SalesChart />
          </div>

          {/* Recent Activity / Alerts */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Alertas Operativas</h3>
              <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">2 Nuevas</span>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer group">
                <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                  <Package size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Stock Crítico: Fiorino</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quedan menos de 10 maples de Huevo Grande.</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Hace 15 min</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors cursor-pointer group">
                <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg text-yellow-500 shadow-sm group-hover:scale-110 transition-transform">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Mantenimiento Requerido</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Boxer debe realizar cambio de aceite en 500km.</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Hace 2 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
