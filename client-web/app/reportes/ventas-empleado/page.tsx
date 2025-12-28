'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

interface ReporteVentaEmpleadoDto {
    usuarioId: number;
    nombreUsuario: string;
    totalDineroVentas: number;
    cantidadHuevosVendidos: number;
    cantidadViajes: number;
    promedioVentasPorViaje: number;
}

export default function VentasEmpleadoPage() {
    const [data, setData] = useState<ReporteVentaEmpleadoDto[]>([]);
    const [loading, setLoading] = useState(false);

    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const [fromDate, setFromDate] = useState<string>(format(firstDay, 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState<string>(format(today, 'yyyy-MM-dd'));

    const fetchData = async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        try {
            const res = await api.get(`/reportes/ventas-empleado?fechaInicio=${fromDate}&fechaFin=${toDate}`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white">Rendimiento de Empleados</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Analiza el rendimiento y ventas de cada chofer/empleado.
                        </p>
                    </div>

                    <div className="flex gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="date"
                                className="bg-transparent border-none text-slate-700 dark:text-slate-200 focus:ring-0 outline-none"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                className="bg-transparent border-none text-slate-700 dark:text-slate-200 focus:ring-0 outline-none"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center h-10 w-10"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                    <th className="p-4 font-bold text-slate-600 dark:text-slate-300">Chofer / Empleado</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-right">Total Ventas ($)</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-right">Huevos Vendidos</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-center">Viajes</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-slate-300 text-right">Promedio / Viaje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {loading && data.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Cargando datos...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No se encontraron ventas en este periodo.</td></tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.usuarioId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4 font-medium text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                        {item.nombreUsuario.charAt(0).toUpperCase()}
                                                    </div>
                                                    {item.nombreUsuario}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-black text-green-600 dark:text-green-400 text-lg">
                                                $ {item.totalDineroVentas.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right text-slate-700 dark:text-slate-300">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold">{(item.cantidadHuevosVendidos / 30).toFixed(1)} <span className="text-xs font-normal text-slate-400 ml-1">Maples</span></span>
                                                    <span className="text-xs text-slate-400">({Math.round(item.cantidadHuevosVendidos).toLocaleString()} huevos)</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-slate-700 dark:text-slate-300">
                                                <span className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-bold min-w-[2rem]">
                                                    {item.cantidadViajes}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300">
                                                $ {item.promedioVentasPorViaje.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
