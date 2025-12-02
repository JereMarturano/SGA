'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SalesChart from '@/components/SalesChart';
import { PieChart, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '@/lib/axios';

export default function EstadisticasPage() {
    const [stats, setStats] = useState({
        totalVentas: 0,
        huevosVendidos: 0,
        clientesActivos: 0
    });
    const [chartData, setChartData] = useState<{ name: string; ventas: number }[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const date = new Date();
                const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                const startStr = firstDay.toISOString().split('T')[0];
                const endStr = lastDay.toISOString().split('T')[0];

                const response = await api.get(`/reportes/financiero?inicio=${startStr}&fin=${endStr}`);
                const data = response.data;

                setStats({
                    totalVentas: data.totalVentas,
                    huevosVendidos: data.totalHuevosVendidos,
                    clientesActivos: data.clientesActivos
                });

                const chart = data.tendenciaVentas.map((t: any) => ({
                    name: t.fecha,
                    ventas: t.total
                }));
                setChartData(chart);

            } catch (error) {
                console.error('Error fetching statistics:', error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white">Estadísticas Generales</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Análisis de rendimiento y ventas</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <Calendar size={16} />
                            Este Mes
                        </button>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Ventas Totales</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">$ {stats.totalVentas.toLocaleString()}</h3>
                            <span className="flex items-center text-green-500 text-sm font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                <ArrowUpRight size={16} /> +15%
                            </span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Huevos Vendidos</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.huevosVendidos.toLocaleString()}</h3>
                            <span className="flex items-center text-green-500 text-sm font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                <ArrowUpRight size={16} /> +8%
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Unidades</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Clientes Activos</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stats.clientesActivos}</h3>
                            <span className="flex items-center text-blue-500 text-sm font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                <TrendingUp size={16} /> +3
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
                        <SalesChart data={chartData} />
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                <PieChart size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ventas por Tipo de Huevo</h3>
                        </div>

                        {/* Placeholder for a Pie Chart or Distribution Stats */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-slate-700 dark:text-slate-300">Blanco Grande (Nº1)</span>
                                    <span className="text-slate-800 dark:text-white font-bold">45%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-slate-700 dark:text-slate-300">Color Grande (Nº1)</span>
                                    <span className="text-slate-800 dark:text-white font-bold">30%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-slate-700 dark:text-slate-300">Blanco Mediano (Nº2)</span>
                                    <span className="text-slate-800 dark:text-white font-bold">15%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-slate-700 dark:text-slate-300">Color Mediano (Nº2)</span>
                                    <span className="text-slate-800 dark:text-white font-bold">10%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-2">Producto Más Vendido</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm">El <span className="font-bold text-blue-600 dark:text-blue-400">Blanco Grande</span> representa casi la mitad de las ventas este mes.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
