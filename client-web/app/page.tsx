'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Truck, DollarSign, Package, Warehouse, AlertCircle } from 'lucide-react';
import KPICard from '@/components/KPICard';
import SalesChart from '@/components/SalesChart';
import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';
import Header from '@/components/Header';
import api from '@/lib/axios';
import { VentaPorFecha } from '@/lib/api-reportes';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ViajeActivo {
  viajeId: number;
  vehiculoId: number;
  vehiculo: { patente: string; modelo: string };
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTrip, setActiveTrip] = useState<ViajeActivo | null>(null);
  const [checkingTrip, setCheckingTrip] = useState(true);
  const [misVentas, setMisVentas] = useState<any[]>([]);
  const [ventasTotalHoy, setVentasTotalHoy] = useState(0);

  // Chofer Stats
  const [cashControl, setCashControl] = useState({
    efectivo: 0,
    mp: 0,
    ctaCte: 0,
    total: 0
  });

  // Admin Stats
  const [stats, setStats] = useState({
    ventasDia: 0,
    margenNeto: 0,
    vehiculosEnRuta: 0,
    mermasCount: 0,
    variacionVentas: 0,
    tendenciaVentasPositiva: true,
    variacionMargen: 0,
    tendenciaMargenPositiva: true,
  });

  const [chartData, setChartData] = useState<VentaPorFecha[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user?.Rol === 'Chofer') {
      // Check for active trip
      const checkTrip = async () => {
        try {
          const res = await api.get(`/viajes/activo-por-usuario/${user.UsuarioId}`);
          setActiveTrip(res.data);

          if (res.data?.vehiculoId) {
            // Fetch recent sales for this vehicle (today)
            const today = new Date().toISOString().split('T')[0];
            const ventasRes = await api.get(`/ventas/vehiculo/${res.data.vehiculoId}?fecha=${today}`);
            setMisVentas(ventasRes.data);
            const total = ventasRes.data.reduce((acc: number, v: any) => acc + v.total, 0);
            setVentasTotalHoy(total);

            // Calculate Cash Control
            const control = ventasRes.data.reduce((acc: any, v: any) => {
              if (v.metodoPago === 0 || v.metodoPago === 'Efectivo') acc.efectivo += v.total;
              else if (v.metodoPago === 1 || v.metodoPago === 'MercadoPago') acc.mp += v.total;
              else if (v.metodoPago === 2 || v.metodoPago === 'CuentaCorriente') acc.ctaCte += v.total;
              acc.total += v.total;
              return acc;
            }, { efectivo: 0, mp: 0, ctaCte: 0, total: 0 });
            setCashControl(control);
          }
        } catch (error) {
          console.log("No active trip found or error", error);
          setActiveTrip(null);
        } finally {
          setCheckingTrip(false);
        }
      };
      checkTrip();
    } else {
      // Load Admin Dashboard
      setCheckingTrip(false);
      fetchAdminStats();
    }
  }, [user, authLoading]);

  const fetchAdminStats = async () => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 6); // Last 7 days

        const todayStr = today.toISOString().split('T')[0];
        const startStr = startOfWeek.toISOString().split('T')[0];

        // Fetch Financial Report for Today (for KPIs)
        const financieroHoyRes = await api.get(
          `/reportes/financiero?inicio=${todayStr}&fin=${todayStr}`
        );
        const financieroHoy = financieroHoyRes.data;

        // Fetch Financial Report for Last 7 Days (for Chart)
        const financieroSemanaRes = await api.get(
          `/reportes/financiero?inicio=${startStr}&fin=${todayStr}`
        );
        const financieroSemana = financieroSemanaRes.data;

        // Fetch Stock en Calle to count vehicles
        const stockRes = await api.get('/reportes/stock-calle');
        const stock = stockRes.data;
        const enRuta = stock.filter((v: any) => v.enRuta).length;

        setStats({
          ventasDia: financieroHoy.totalVentas,
          margenNeto: financieroHoy.margenGananciaPorcentaje,
          vehiculosEnRuta: enRuta,
          mermasCount: 0, // Placeholder
          variacionVentas: financieroHoy.variacionVentas,
          tendenciaVentasPositiva: financieroHoy.tendenciaVentasPositiva,
          variacionMargen: financieroHoy.variacionMargen,
          tendenciaMargenPositiva: financieroHoy.tendenciaMargenPositiva,
        });

        // Map trend data for chart
        if (financieroSemana.ventasPorFecha) {
          setChartData(financieroSemana.ventasPorFecha);
        } else if (financieroSemana.tendenciaVentas) {
          setChartData(financieroSemana.tendenciaVentas);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    const fetchAlertas = async () => {
      try {
        const res = await api.get('/alertas');
        setAlertas(res.data);
      } catch (error) {
        console.error('Error fetching alertas:', error);
      }
    };

    fetchStats();
    fetchAlertas();
  };

  if (authLoading || checkingTrip) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">Cargando...</div>;
  }

  // --- CHOFER VIEW ---
  if (user?.Rol === 'Chofer') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100 dark:border-slate-700">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Hola {user.Nombre}</h2>
            <p className="text-slate-500 dark:text-slate-400">Panel de Chofer</p>
          </div>

          {!activeTrip ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="bg-orange-100 dark:bg-orange-900/20 p-6 rounded-full mb-6">
                <AlertCircle size={64} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No tenés viaje asignado</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                Esperá a que un administrador te autorice una salida para poder empezar a vender.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Truck size={32} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 text-lg">Viaje Activo</h3>
                    <p className="text-blue-700 dark:text-blue-300">
                      Vehículo: {activeTrip.vehiculo?.modelo} ({activeTrip.vehiculo?.patente})
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-blue-800 dark:text-blue-300">Vendido Hoy</p>
                  <p className="text-2xl font-black text-blue-900 dark:text-white">${ventasTotalHoy.toLocaleString('es-AR')}</p>
                </div>
              </div>

              {/* Cash Control Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                    <DollarSign size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Control de Caja</h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Efectivo</p>
                    <p className="font-black text-green-600 dark:text-green-400 text-lg sm:text-xl">
                      ${cashControl.efectivo.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Mercado Pago</p>
                    <p className="font-black text-blue-500 dark:text-blue-400 text-lg sm:text-xl">
                      ${cashControl.mp.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Cta. Cte.</p>
                    <p className="font-black text-orange-500 dark:text-orange-400 text-lg sm:text-xl">
                      ${cashControl.ctaCte.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Recaudado (Sin Cta Cte)</span>
                  <span className="font-bold text-slate-800 dark:text-white text-lg">
                    ${(cashControl.efectivo + cashControl.mp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href="/simulacion-ventas"
                  className="group bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-3xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:scale-[1.02] flex flex-col items-center justify-center gap-4 text-center"
                >
                  <div className="bg-white/20 p-4 rounded-2xl group-hover:rotate-12 transition-transform">
                    <DollarSign size={48} />
                  </div>
                  <span className="text-2xl">Nueva Venta</span>
                </Link>

                <Link
                  href={`/stock-vehiculo/${activeTrip.vehiculoId}`}
                  className="group bg-slate-800 hover:bg-slate-900 text-white p-8 rounded-3xl font-bold transition-all shadow-lg hover:scale-[1.02] flex flex-col items-center justify-center gap-4 text-center"
                >
                  <div className="bg-white/20 p-4 rounded-2xl group-hover:rotate-12 transition-transform">
                    <Package size={48} />
                  </div>
                  <span className="text-2xl">Stock en Vehículo</span>
                </Link>
              </div>

              {/* Recent Sales List */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Mis Ventas de Hoy</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {misVentas.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Aun no has realizado ventas hoy.</p>
                  ) : (
                    misVentas.map((venta: any) => (
                      <div key={venta.ventaId} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{venta.cliente?.nombre} {venta.cliente?.apellido}</p>
                          <p className="text-xs text-slate-400">{new Date(venta.fecha).toLocaleTimeString().slice(0, 5)} hs</p>
                        </div>
                        <span className="font-mono font-bold text-green-600 dark:text-green-400">
                          ${venta.total.toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- ADMIN / OFFICE VIEW (Original Dashboard code below) ---

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
              <Link
                href="/carga-camioneta"
                className="group bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3"
              >
                <div className="bg-white dark:bg-slate-600 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Truck size={20} className="text-blue-500 dark:text-blue-400" />
                </div>
                Cargar Camioneta
              </Link>

              <Link
                href="/inventario-general"
                className="group bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3"
              >
                <div className="bg-white dark:bg-slate-600 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Warehouse size={20} className="text-blue-500 dark:text-blue-400" />
                </div>
                Cargar Inv. General
              </Link>

              <Link
                href="/punto-venta"
                className="group bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-1 flex items-center gap-3"
              >
                <div className="bg-white/20 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                  <DollarSign size={20} />
                </div>
                Nueva Venta
              </Link>

              <Link
                href="/simulacion-ventas"
                className="group bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-1 flex items-center gap-3"
              >
                <div className="bg-white/20 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                  <Package size={20} />
                </div>
                Simulación Ventas
              </Link>

              <Link
                href="/gastos"
                className="group bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3"
              >
                <div className="bg-white dark:bg-slate-600 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <DollarSign size={20} className="text-red-500 dark:text-red-400" />
                </div>
                Gastos
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
            trend={`${(stats.variacionVentas || 0) > 0 ? '+' : ''}${(stats.variacionVentas || 0).toFixed(1)}%`}
            trendUp={stats.tendenciaVentasPositiva}
            color="green"
          />
          <KPICard
            title="Margen Neto"
            value={`${(stats.margenNeto || 0).toFixed(1)}%`}
            icon={TrendingUp}
            trend={`${(stats.variacionMargen || 0) > 0 ? '+' : ''}${(stats.variacionMargen || 0).toFixed(1)}%`}
            trendUp={stats.tendenciaMargenPositiva}
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
            <SalesChart data={chartData} />
          </div>

          {/* Alerts Panel */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full max-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Alertas Operativas
              </h3>
              {alertas.length > 0 && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  {alertas.length} Nuevas
                </span>
              )}
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {alertas.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No hay alertas recientes.</p>
              ) : (
                alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-all cursor-pointer group ${alerta.tipo === 'Warning' ? 'hover:border-red-200 dark:hover:border-red-900/50' : 'hover:border-blue-200 dark:hover:border-blue-900/50'}`}
                  >
                    <div
                      className={`mt-1 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform ${alerta.tipo === 'Warning' ? 'text-red-500' : 'text-blue-500'}`}
                    >
                      {alerta.icono === 'Package' ? (
                        <Package size={20} />
                      ) : alerta.icono === 'Truck' ? (
                        <Truck size={20} />
                      ) : alerta.icono === 'DollarSign' ? (
                        <DollarSign size={20} />
                      ) : (
                        <TrendingUp size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">
                        {alerta.titulo}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {alerta.mensaje}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide">
                        {new Date(alerta.fecha).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
