'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Truck, ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

interface StockDetalle {
    producto: string;
    cantidad: number;
}

interface StockEnCalle {
    vehiculoId: number;
    vehiculoNombre: string;
    enRuta: boolean;
    stock: StockDetalle[];
}

export default function StockCallePage() {
    const [data, setData] = useState<StockEnCalle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/reportes/stock-calle');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching stock en calle:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-6">
                    <Link href="/" className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        Volver al Dashboard
                    </Link>
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                        <Truck size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Stock en Calle</h1>
                        <p className="text-slate-500 dark:text-slate-400">Estado actual de los vehículos y su mercadería.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10">Cargando...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.map((vehiculo) => (
                            <div key={vehiculo.vehiculoId} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{vehiculo.vehiculoNombre}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${vehiculo.enRuta
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>
                                        {vehiculo.enRuta ? 'En Ruta' : 'En Depósito'}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-3">
                                    {vehiculo.stock.length > 0 ? (
                                        vehiculo.stock.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-700/50 last:border-0 pb-2 last:pb-0">
                                                <span className="text-slate-600 dark:text-slate-300">{item.producto}</span>
                                                <span className="font-bold text-slate-800 dark:text-white">{item.cantidad}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-slate-400 text-sm italic text-center py-4">Sin stock cargado</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
