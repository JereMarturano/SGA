'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Truck, DollarSign, Package, Warehouse, AlertCircle, Settings, X, Users } from 'lucide-react';
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
  fechaSalida: string;
  choferId: number;
  chofer: { nombre: string; apellido: string };
  acompananteId?: number | null;
  acompanante?: { nombre: string; apellido: string } | null;
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

  // --- CUSTOMIZATION STATE ---
  interface Shortcut {
    id: string;
    name: string;
    href: string;
    color: string; // 'blue' | 'green' | 'red' | 'orange' | 'slate'
    icon: string; // 'Truck' | 'Package' | 'DollarSign' | 'Users' | 'Warehouse'
  }

  interface DashboardConfig {
    showWeather: boolean;
    showKPIs: boolean;
    showChart: boolean;
    showAlerts: boolean;
    shortcuts: Shortcut[];
  }

  const DEFAULT_CONFIG: DashboardConfig = {
    showWeather: true,
    showKPIs: true,
    showChart: true,
    showAlerts: true,
    shortcuts: [
      { id: '1', name: 'Cargar Camioneta', href: '/carga-camioneta', color: 'slate', icon: 'Truck' },
      { id: '2', name: 'Cargar Inv. General', href: '/inventario-general', color: 'slate', icon: 'Warehouse' },
      { id: '3', name: 'Pedidos', href: '/pedidos', icon: 'Package', color: 'slate' },
      { id: '4', name: 'Nueva Venta', href: '/punto-venta', color: 'blue', icon: 'DollarSign' },
      { id: '5', name: 'Gastos', href: '/gastos', color: 'slate', icon: 'DollarSign' },
    ]
  };

  const SYSTEM_SHORTCUT_IDS = ['1', '2', '3', '4', '5'];

  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [isEditing, setIsEditing] = useState(false);
  const [newShortcut, setNewShortcut] = useState<Partial<Shortcut>>({ color: 'slate', icon: 'Package' });

  useEffect(() => {
    const saved = localStorage.getItem('dashboardConfig');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  const saveConfig = (newConfig: DashboardConfig) => {
    setConfig(newConfig);
    localStorage.setItem('dashboardConfig', JSON.stringify(newConfig));
  };

  const toggleWidget = (key: keyof DashboardConfig) => {
    if (typeof config[key] === 'boolean') {
      saveConfig({ ...config, [key]: !config[key] });
    }
  };

  const addShortcut = () => {
    if (!newShortcut.name || !newShortcut.href) return;
    const shortcut: Shortcut = {
      id: Date.now().toString(),
      name: newShortcut.name,
      href: newShortcut.href,
      color: newShortcut.color || 'slate',
      icon: newShortcut.icon || 'Package'
    };
    saveConfig({ ...config, shortcuts: [...config.shortcuts, shortcut] });
    setNewShortcut({ color: 'slate', icon: 'Package', name: '', href: '' });
  };

  const removeShortcut = (id: string) => {
    saveConfig({ ...config, shortcuts: config.shortcuts.filter(s => s.id !== id) });
  };

  const renderIcon = (iconName: string, size: number = 20, className?: string) => {
    const props = { size, className };
    switch (iconName) {
      case 'Truck': return <Truck {...props} />;
      case 'Package': return <Package {...props} />;
      case 'DollarSign': return <DollarSign {...props} />;
      case 'Users': return <Users {...props} />; // Imported below if needed, else assumes logic works
      case 'Warehouse': return <Warehouse {...props} />;
      default: return <Package {...props} />;
    }
  };


  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user?.Rol === 'Chofer' || user?.Rol === 'Vendedor') {
      // Check for active trip
      const checkTrip = async () => {
        try {
          const res = await api.get(`/viajes/activo-por-usuario/${user.UsuarioId}`);
          setActiveTrip(res.data);

          // Fetch recent sales for this vehicle (starting from trip start time)
          // If active trip exists, we filter by exact trip start time
          if (res.data?.vehiculoId) {
            // NEW: Fetch by ViajeId for accurate Cash Control
            const ventasRes = await api.get(`/ventas/viaje/${res.data.viajeId}`);
            const ventasFiltradas = ventasRes.data;

            setMisVentas(ventasFiltradas);
            const total = ventasFiltradas.reduce((acc: number, v: any) => acc + v.total, 0);
            setVentasTotalHoy(total);

            // Calculate Cash Control
            const control = ventasFiltradas.reduce((acc: any, v: any) => {
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

  // --- CHOFER / VENDEDOR VIEW ---
  if (user?.Rol === 'Chofer' || user?.Rol === 'Vendedor') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100 dark:border-slate-700">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Hola {user.Nombre}</h2>
            <p className="text-slate-500 dark:text-slate-400">
              {activeTrip?.acompananteId === user.UsuarioId
                ? `Acompañante de ${activeTrip.chofer?.nombre} ${activeTrip.chofer?.apellido}`
                : 'Panel de Chofer'}
            </p>
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
                  className="group bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-3xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-1 flex flex-col items-center justify-center gap-4 text-center"
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
              <div className="flex items-center gap-4">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                  Hola Santiago
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-blue-600'}`}
                >
                  <Settings size={20} />
                </button>
              </div>

              <span className="block text-xl md:text-2xl font-medium text-slate-500 dark:text-slate-400 mt-1">
                la temperatura hoy en Molinari es:
              </span>

              {config.showWeather && (
                <div className="relative group">
                  <WeatherWidget />
                  {isEditing && (
                    <button
                      onClick={() => toggleWidget('showWeather')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
              {!config.showWeather && isEditing && (
                <button onClick={() => toggleWidget('showWeather')} className="px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-500 hover:text-blue-500">
                  + Mostrar Clima
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 max-w-xl justify-end">
              {config.shortcuts.map((sc) => (
                <div key={sc.id} className="relative group">
                  <Link
                    href={sc.href}
                    className={`group ${sc.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600'} px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 relative`}
                  >
                    <div className={`${sc.color === 'blue' ? 'bg-white/20' : 'bg-white dark:bg-slate-600'} p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform`}>
                      {renderIcon(sc.icon, 20, sc.color === 'blue' ? '' : 'text-blue-500 dark:text-blue-400')}
                    </div>
                    {sc.name}
                  </Link>
                  {isEditing && !SYSTEM_SHORTCUT_IDS.includes(sc.id) && (
                    <button
                      onClick={(e) => { e.preventDefault(); removeShortcut(sc.id); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md z-10"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}

              {isEditing && (
                <div className="flex flex-col gap-2 p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[200px]">
                  <p className="text-xs font-bold text-slate-500">Nuevo Atajo</p>
                  <input
                    type="text"
                    placeholder="Nombre (ej: Galpones)"
                    className="text-xs p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                    value={newShortcut.name}
                    onChange={e => setNewShortcut({ ...newShortcut, name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Rutan (ej: /stock-general)"
                    className="text-xs p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                    value={newShortcut.href}
                    onChange={e => setNewShortcut({ ...newShortcut, href: e.target.value })}
                  />
                  <select
                    className="text-xs p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                    value={newShortcut.icon}
                    onChange={e => setNewShortcut({ ...newShortcut, icon: e.target.value })}
                  >
                    <option value="Package">Paquete</option>
                    <option value="Truck">Camión</option>
                    <option value="DollarSign">Dinero</option>
                    <option value="Warehouse">Galpón</option>
                    <option value="Users">Usuarios</option>
                  </select>
                  <button onClick={addShortcut} className="text-xs bg-blue-600 text-white rounded p-2 font-bold hover:bg-blue-700">Agregar</button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* KPI Grid */}
        {config.showKPIs ? (
          <div className="relative group">
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
                title="Gestión de Viaje"
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
            {isEditing && (
              <button
                onClick={() => toggleWidget('showKPIs')}
                className="absolute -top-3 right-0 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md z-10"
              >
                Ocultar KPIs
              </button>
            )}
          </div>
        ) : (
          isEditing && (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
              <button onClick={() => toggleWidget('showKPIs')} className="text-slate-500 font-bold hover:text-blue-600">
                + Mostrar KPIs
              </button>
            </div>
          )
        )}


        {/* Charts & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 relative group">
            {config.showChart ? (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 h-full">
                  <SalesChart data={chartData} />
                </div>
                {isEditing && (
                  <button
                    onClick={() => toggleWidget('showChart')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                )}
              </>
            ) : (
              isEditing && (
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center h-full flex items-center justify-center">
                  <button onClick={() => toggleWidget('showChart')} className="text-slate-500 font-bold hover:text-blue-600">
                    + Mostrar Gráfico
                  </button>
                </div>
              )
            )}
          </div>

          {/* Alerts Panel */}
          <div className="relative group h-full">
            {config.showAlerts ? (
              <>
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
                {isEditing && (
                  <button
                    onClick={() => toggleWidget('showAlerts')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                )}
              </>
            ) : (
              isEditing && (
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center h-full flex items-center justify-center">
                  <button onClick={() => toggleWidget('showAlerts')} className="text-slate-500 font-bold hover:text-blue-600">
                    + Mostrar Alertas
                  </button>
                </div>
              )
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
