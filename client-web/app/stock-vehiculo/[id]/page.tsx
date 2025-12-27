'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Cuboid, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';

// Helper types
interface StockItem {
    stockVehiculoId: number;
    vehiculoId: number;
    productoId: number;
    cantidad: number;
    ultimaActualizacion: string;
    producto?: {
        nombre: string;
        tipoProducto: number;
        unidadDeMedida?: string; // [NEW] Added for unit awareness
    };
}

export default function StockVehiculoPage() {
    const params = useParams();
    const vehiculoId = params.id;
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const res = await api.get(`/inventario/stock-vehiculo/${vehiculoId}`);
                setStock(res.data);
            } catch (err: any) {
                console.error('Error fetching stock:', err);
                setError('No se pudo cargar el stock del vehículo.');
            } finally {
                setLoading(false);
            }
        };

        if (vehiculoId) {
            fetchStock();
        }
    }, [vehiculoId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
                Cargando stock...
            </div>
        );
    }

    // Helper to normalize quantity to Maples and Eggs for summary
    const getNormalizedTotals = () => {
        let totalMaples = 0;
        let totalHuevos = 0;

        stock.forEach(item => {
            const uom = item.producto?.unidadDeMedida?.toLowerCase() || 'unidad';
            // Assuming default for eggs is Maple if not specified, but safe fallback is Unit.
            // However, based on previous fix, we know DB returns Maples for eggs.
            const isMaple = uom === 'maple' || uom === 'cajon';

            if (isMaple) {
                totalMaples += item.cantidad;
                totalHuevos += item.cantidad * 30; // 1 Maple = 30 Eggs
            } else {
                // If tracked in units (eggs)
                totalMaples += item.cantidad / 30;
                totalHuevos += item.cantidad;
            }
        });

        return { totalMaples, totalHuevos };
    };

    const { totalMaples, totalHuevos } = getNormalizedTotals();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Header />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/"
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="text-slate-600 dark:text-slate-300" size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                            Stock en Vehículo
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Inventario actual disponible para venta
                        </p>
                    </div>
                </div>

                {error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl flex flex-col items-center text-center gap-4">
                        <AlertTriangle size={48} className="text-red-500" />
                        <p className="text-red-700 dark:text-red-300 font-bold">{error}</p>
                        <Link href="/" className="text-red-600 underline">Volver al inicio</Link>
                    </div>
                ) : stock.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-6">
                        <div className="bg-slate-100 dark:bg-slate-700 p-6 rounded-full">
                            <Package size={48} className="text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Vehículo Vacío</h3>
                            <p className="text-slate-500">No hay mercadería cargada en este vehículo actualmente.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/30 flex justify-between items-center">
                            <div>
                                <p className="text-blue-200 text-sm font-bold uppercase mb-1">Total Carga</p>
                                <p className="text-3xl font-black">{totalMaples.toLocaleString('es-AR', { maximumFractionDigits: 1 })} <span className="text-lg font-medium opacity-80">maples</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-blue-200 text-sm font-bold uppercase mb-1">Unidades</p>
                                <p className="text-xl font-bold">{totalHuevos.toLocaleString('es-AR', { maximumFractionDigits: 0 })} <span className="text-sm font-medium opacity-80">huevos</span></p>
                            </div>
                        </div>

                        {/* List */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            {stock.map((item, index) => {
                                const uom = item.producto?.unidadDeMedida?.toLowerCase() || 'unidad';
                                const isMaple = uom === 'maple' || uom === 'cajon';

                                let displayCajones = 0;
                                let displaySueltos = 0;
                                let sueltosLabel = '';

                                if (isMaple) {
                                    // Cantidad is Maples
                                    // 1 Cajon = 12 Maples
                                    displayCajones = Math.floor(item.cantidad / 12);
                                    displaySueltos = item.cantidad % 12;
                                    sueltosLabel = 'maples';
                                } else {
                                    // Cantidad is Units (Huevos)
                                    // 1 Cajon = 360 Huevos
                                    displayCajones = Math.floor(item.cantidad / 360);
                                    displaySueltos = item.cantidad % 360;
                                    sueltosLabel = 'huevos';
                                }

                                return (
                                    <div
                                        key={item.stockVehiculoId}
                                        className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl">
                                                <Cuboid size={24} className="text-slate-500 dark:text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white text-lg">
                                                    {item.producto?.nombre || `Producto ${item.productoId}`}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {displayCajones} cajones / {displaySueltos.toLocaleString('es-AR', { maximumFractionDigits: 1 })} {sueltosLabel}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-700 dark:text-slate-200 text-xl">
                                                {item.cantidad.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                                            </p>
                                            <p className="text-xs font-bold text-slate-400 uppercase">
                                                {isMaple ? 'Maples' : 'Unidades'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
