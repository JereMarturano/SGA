'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/axios';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChartData {
    name: string;
    ventas: number;
    fullDate: string;
}

export default function SalesChart() {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData(viewMode);
    }, [viewMode]);

    const fetchData = async (mode: 'week' | 'month') => {
        setLoading(true);
        try {
            const now = new Date();
            let start, end;

            if (mode === 'week') {
                // Semana actual
                start = startOfWeek(now, { weekStartsOn: 1 }); // Lunes
                end = endOfWeek(now, { weekStartsOn: 1 });
            } else {
                // Mes actual
                start = startOfMonth(now);
                end = endOfMonth(now);
            }

            const startDate = format(start, 'yyyy-MM-dd');
            const endDate = format(end, 'yyyy-MM-dd');

            const response = await api.get(`/reportes/financiero?inicio=${startDate}&fin=${endDate}`);
            const data = response.data;

            // Transformar datos para el gráfico
            const transformedData = data.ventasPorDia.map((item: any) => {
              const dateObj = parseISO(item.fecha);
              return {
                name: format(dateObj, mode === 'week' ? 'EEE' : 'dd', { locale: es }),
                ventas: item.total,
                fullDate: format(dateObj, 'dd MMM yyyy', { locale: es })
              };
            });

            setChartData(transformedData);
        } catch (error) {
            console.error('Error fetching chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[350px] w-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {viewMode === 'week' ? 'Ventas de la semana' : 'Ventas del mes'}
                </h3>
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            viewMode === 'week'
                                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            viewMode === 'month'
                                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        Mes
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                            itemStyle={{ color: '#1E293B', fontWeight: 'bold' }}
                            labelStyle={{ color: '#64748B', marginBottom: '0.5rem' }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return payload[0].payload.fullDate;
                                }
                                return label;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="ventas"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVentas)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
