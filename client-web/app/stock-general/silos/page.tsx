'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Database, TrendingUp, Settings, Edit2, Save, X } from 'lucide-react';
import Modal from '@/components/Modal';

interface Product {
    productoId: number;
    nombre: string;
    tipoProducto: string;
}

interface Silo {
    siloId: number;
    nombre: string;
    capacidadKg: number;
    cantidadActualKg: number;
    productoId?: number;
    producto?: { nombre: string; };
    precioPromedioCompra: number;
}

export default function SilosPage() {
    const { user } = useAuth();
    const [silos, setSilos] = useState<Silo[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSilo, setSelectedSilo] = useState<Silo | null>(null);

    // Modal State - Carga
    const [isCargaModalOpen, setIsCargaModalOpen] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');

    // Modal State - Config
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [configSilo, setConfigSilo] = useState({
        nombre: '',
        productoId: '',
        capacidadKg: ''
    });

    const fetchSilos = async () => {
        try {
            const res = await api.get('/stock-general/silos');
            setSilos(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/stock-general/deposito');
            // Filter only Insumos for Silos
            setProducts(res.data.filter((p: Product) => p.tipoProducto === 'Insumo'));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([fetchSilos(), fetchProducts()]);
            setIsLoading(false);
        };
        init();
    }, []);

    const handleOpenCarga = (silo: Silo) => {
        setSelectedSilo(silo);
        setQuantity('');
        setPrice('');
        setIsCargaModalOpen(true);
    };

    const handleOpenConfig = (silo: Silo) => {
        setSelectedSilo(silo);
        setConfigSilo({
            nombre: silo.nombre,
            productoId: silo.productoId?.toString() || '',
            capacidadKg: silo.capacidadKg.toString()
        });
        setIsConfigModalOpen(true);
    };

    const submitCarga = async () => {
        if (!selectedSilo || !quantity || !price) return;
        try {
            await api.post('/stock-general/silos/carga', {
                siloId: selectedSilo.siloId,
                cantidadKg: parseFloat(quantity),
                precioTotal: parseFloat(price)
            });
            setIsCargaModalOpen(false);
            fetchSilos();
        } catch (error) {
            alert('Error en carga');
        }
    };

    const submitConfig = async () => {
        if (!selectedSilo) return;
        try {
            await api.post('/stock-general/silos/ajuste', {
                siloId: selectedSilo.siloId,
                nombre: configSilo.nombre,
                capacidadKg: parseFloat(configSilo.capacidadKg),
                cantidadKg: selectedSilo.cantidadActualKg,
                productoId: configSilo.productoId ? parseInt(configSilo.productoId) : null
            });

            setIsConfigModalOpen(false);
            fetchSilos();
        } catch (error) {
            alert('Error al configurar silo');
        }
    };

    const getPercent = (current: number, capacity: number) => {
        return Math.min(100, Math.max(0, (current / capacity) * 100));
    };

    const isAdmin = user?.Rol === 'Admin';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Silos</h1>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {silos.map((s) => {
                            const percent = getPercent(s.cantidadActualKg, s.capacidadKg);
                            const isMobile = s.nombre.toLowerCase().includes('carro');

                            return (
                                <div key={s.siloId} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col relative overflow-hidden transition-all hover:shadow-2xl ${isMobile ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}>
                                    {isMobile && (
                                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-3 py-1 font-bold uppercase tracking-wider rounded-bl-lg">
                                            Móvil
                                        </div>
                                    )}

                                    <div className="z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{s.nombre}</h3>
                                                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                                    {s.producto?.nombre || 'Vacío'}
                                                </span>
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleOpenConfig(s)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="Configurar Silo"
                                                >
                                                    <Settings size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{s.cantidadActualKg.toLocaleString()}</span>
                                            <span className="text-xs text-gray-400 font-medium">/ {s.capacidadKg.toLocaleString()} Kg</span>
                                        </div>

                                        {/* Visual Tank representation */}
                                        <div className="relative w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <div
                                                className={`absolute bottom-0 w-full transition-all duration-1000 ease-out opacity-80 ${percent < 15 ? 'bg-gradient-to-t from-red-600 to-red-400' :
                                                    percent < 30 ? 'bg-gradient-to-t from-orange-500 to-orange-300' :
                                                        'bg-gradient-to-t from-green-600 to-green-400'
                                                    }`}
                                                style={{ height: `${percent}%` }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className={`text-sm font-bold ${percent > 50 ? 'text-white' : 'text-gray-500'}`}>
                                                    {percent.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between text-[11px] text-gray-500 mb-6 font-medium">
                                            <div className="flex items-center gap-1">
                                                <TrendingUp size={12} />
                                                <span>PPP: ${s.precioPromedioCompra.toFixed(2)}</span>
                                            </div>
                                            <span>Estado: Activo</span>
                                        </div>

                                        {isAdmin && (
                                            <button
                                                onClick={() => handleOpenCarga(s)}
                                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 font-semibold text-sm"
                                            >
                                                <Database size={16} />
                                                Registrar Carga
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* MODAL CARGA */}
                <Modal isOpen={isCargaModalOpen} onClose={() => setIsCargaModalOpen(false)} title="Cargar Silo">
                    <div className="space-y-4 p-2">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                Silo: <span className="font-bold">{selectedSilo?.nombre}</span>
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                                Contenido: {selectedSilo?.producto?.nombre || 'Ninguno'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Cantidad a Ingresar (Kg)</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-lg font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Costo Total de la Compra ($)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-lg font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                            <p className="text-[10px] text-gray-400 mt-2 italic px-1">Este valor se utilizará para calcular el Precio Promedio Ponderado.</p>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={submitCarga}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
                            >
                                Confirmar Ingreso de Mercadería
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* MODAL CONFIG */}
                <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Configurar Silo">
                    <div className="space-y-5 p-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ajuste el nombre y el producto que se encuentra actualmente en el silo.
                        </p>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Nombre del Silo / Ubicación</label>
                            <input
                                type="text"
                                value={configSilo.nombre}
                                onChange={(e) => setConfigSilo({ ...configSilo, nombre: e.target.value })}
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: Silo 1"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Producto Contenido</label>
                            <select
                                value={configSilo.productoId}
                                onChange={(e) => setConfigSilo({ ...configSilo, productoId: e.target.value })}
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Sin Producto / Vacío --</option>
                                {products.map(p => (
                                    <option key={p.productoId} value={p.productoId}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Capacidad Máxima (Kg)</label>
                            <input
                                type="number"
                                value={configSilo.capacidadKg}
                                onChange={(e) => setConfigSilo({ ...configSilo, capacidadKg: e.target.value })}
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={() => setIsConfigModalOpen(false)}
                                className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={submitConfig}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </Modal>

            </main>
        </div>
    );
}

