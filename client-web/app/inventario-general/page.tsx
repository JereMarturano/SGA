'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Package, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface Producto {
    productoId: number;
    nombre: string;
    stockActual: number;
}

export default function InventarioGeneralPage() {
    const router = useRouter();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        productoId: '',
        cantidad: '',
        observaciones: ''
    });

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                // Assuming this endpoint exists, otherwise we might need to create it or use a different one
                const response = await api.get('/productos');
                setProductos(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProductos();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/inventario/compra', {
                productoId: parseInt(formData.productoId),
                cantidad: parseFloat(formData.cantidad),
                usuarioId: 1, // Hardcoded for now, should come from auth context
                observaciones: formData.observaciones
            });
            alert('Compra registrada exitosamente');
            router.push('/');
        } catch (error) {
            console.error('Error registering purchase:', error);
            alert('Error al registrar la compra');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Header />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-6">
                    <Link href="/" className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        Volver al Dashboard
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <Package size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Cargar Inventario General</h1>
                            <p className="text-slate-500 dark:text-slate-400">Registrar compra de mercadería para el depósito central.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Producto
                            </label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.productoId}
                                onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
                            >
                                <option value="">Seleccione un producto...</option>
                                {productos.map(p => (
                                    <option key={p.productoId} value={p.productoId}>
                                        {p.nombre} (Stock actual: {p.stockActual})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Cantidad (Unidades/Bultos)
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                step="0.01"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.cantidad}
                                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                placeholder="Ej: 25"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Observaciones
                            </label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                rows={3}
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                placeholder="Detalles de la compra..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Guardando...' : (
                                <>
                                    <Save size={20} />
                                    Registrar Compra
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
