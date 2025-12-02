'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { VentaPorFecha } from '@/lib/api-reportes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesChartProps {
    data: VentaPorFecha[];
}

export default function SalesChart({ data }: SalesChartProps) {
    const chartData = data.map(d => ({
        name: format(new Date(d.fecha), 'dd/MM', { locale: es }),
        ventas: d.total,
        fullDate: format(new Date(d.fecha), 'PPPP', { locale: es })
    }));

    return (
        <div className="h-[350px] w-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tendencia de Ventas</h3>
            </div>
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
        </div>
    );
}
