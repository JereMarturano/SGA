'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SalesChart from '@/components/SalesChart';
import { PieChart, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fetchReporteFinanciero, ReporteFinanciero } from '@/lib/api-reportes';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EstadisticasPage() {
    const [reporte, setReporte] = useState<ReporteFinanciero | null>(null);
    const [loading, setLoading] = useState(true);
    const [fechaInicio, setFechaInicio] = useState<Date>(startOfMonth(new Date()));
    const [fechaFin, setFechaFin] = useState<Date>(endOfMonth(new Date()));

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchReporteFinanciero(fechaInicio, fechaFin);
            setReporte(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [fechaInicio, fechaFin]);

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Simple implementation for date change
    };

    const getTopProduct = () => {
        if (!reporte?.ventasPorProducto || reporte.ventasPorProducto.length === 0) return null;
        return reporte.ventasPorProducto[0];
    };

    const topProduct = getTopProduct();

    // Calculate colors for pie chart distribution (simple cycling)
    const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white">Estadísticas Generales</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Análisis de rendimiento y ventas</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
                            <span className="text-xs font-bold text-slate-500">Desde:</span>
                            <input
                                type="date"
                                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
                                value={format(fechaInicio, 'yyyy-MM-dd')}
                                onChange={(e) => setFechaInicio(new Date(e.target.value))}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
                             <span className="text-xs font-bold text-slate-500">Hasta:</span>
                            <input
                                type="date"
                                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
                                value={format(fechaFin, 'yyyy-MM-dd')}
                                onChange={(e) => setFechaFin(new Date(e.target.value))}
                            />
                        </div>
                         <button
                            onClick={loadData}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                         >
                            Filtrar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Cargando estadísticas...</div>
                ) : !reporte ? (
                    <div className="text-center py-20 text-red-500">Error al cargar datos.</div>
                ) : (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Ventas Totales</p>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                                        $ {reporte.totalVentas.toLocaleString('es-AR')}
                                    </h3>
                                    <span className="flex items-center text-green-500 text-sm font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                        <ArrowUpRight size={16} /> Rentabilidad: {reporte.margenGananciaPorcentaje.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Gastos</p>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                                        $ {reporte.totalGastos.toLocaleString('es-AR')}
                                    </h3>
                                    <span className="flex items-center text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                                        <ArrowDownRight size={16} /> Gastos
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Ticket Promedio</p>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                                        $ {reporte.ticketPromedio.toLocaleString('es-AR')}
                                    </h3>
                                    <span className="flex items-center text-blue-500 text-sm font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                        <TrendingUp size={16} /> {reporte.cantidadVentas} Op.
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                        <TrendingUp size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Evolución de Ventas</h3>
                                </div>
                                <SalesChart data={reporte.ventasPorFecha} />
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                        <PieChart size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ventas por Producto</h3>
                                </div>

                                <div className="space-y-6">
                                    {reporte.ventasPorProducto.slice(0, 5).map((prod, idx) => {
                                        const percentage = reporte.totalVentas > 0 ? (prod.totalGenerado / reporte.totalVentas) * 100 : 0;
                                        return (
                                            <div key={prod.productoId} className="space-y-2">
                                                <div className="flex justify-between text-sm font-medium">
                                                    <span className="text-slate-700 dark:text-slate-300 truncate w-2/3">{prod.nombreProducto}</span>
                                                    <span className="text-slate-800 dark:text-white font-bold">{percentage.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                                    <div className={`${colors[idx % colors.length]} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {reporte.ventasPorProducto.length === 0 && (
                                        <p className="text-center text-slate-500 text-sm">No hay ventas registradas en este período.</p>
                                    )}
                                </div>

                                {topProduct && (
                                    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-2">Producto Más Vendido</h4>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm">
                                            El <span className="font-bold text-blue-600 dark:text-blue-400">{topProduct.nombreProducto}</span> lidera las ventas con {topProduct.cantidadVendida} unidades.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
