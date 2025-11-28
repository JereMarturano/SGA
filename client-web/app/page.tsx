'use client';

import { LayoutDashboard, TrendingUp, Truck, DollarSign, Package } from 'lucide-react';
import KPICard from '@/components/KPICard';
import SalesChart from '@/components/SalesChart';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Torre de Control</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Avícola San Gabriel - Resumen Operativo</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Truck size={20} />
            Cargar Camioneta
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <DollarSign size={20} />
            Nueva Venta
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Alertas Recientes</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="mt-1 text-red-500">
                <Package size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Stock Crítico: Fiorino</p>
                <p className="text-xs text-red-600 dark:text-red-300">Quedan menos de 10 maples de Huevo Grande.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="mt-1 text-yellow-500">
                <Truck size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Mantenimiento Requerido</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300">Boxer debe realizar cambio de aceite en 500km.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
