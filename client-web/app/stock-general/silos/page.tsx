'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Database, TrendingUp, Settings } from 'lucide-react';
import Modal from '@/components/Modal';

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
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSilo, setSelectedSilo] = useState<Silo | null>(null);

    // Modal State
    const [isCargaModalOpen, setIsCargaModalOpen] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');

    const fetchSilos = async () => {
        try {
            const res = await api.get('/stock-general/silos');
            setSilos(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSilos();
    }, []);

    const handleOpenCarga = (silo: Silo) => {
        setSelectedSilo(silo);
        setQuantity('');
        setPrice('');
        setIsCargaModalOpen(true);
    };

    const submitCarga = async () => {
        if (!selectedSilo || !quantity || !price) return;
        try {
            await api.post('/stock-general/silos/carga', {
                siloId: selectedSilo.siloId,
                cantidadKg: parseFloat(quantity),
                precioTotal: parseFloat(price) // "cuanto le salio" = Total Price
            });
            setIsCargaModalOpen(false);
            fetchSilos();
        } catch (error) {
            alert('Error en carga');
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Estado de Silos</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {silos.map((s) => {
                        const percent = getPercent(s.cantidadActualKg, s.capacidadKg);
                        return (
                            <div key={s.siloId} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col relative overflow-hidden">
                                <div className="z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{s.nombre}</h3>
                                        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                            {s.producto?.nombre || 'Vacío'}
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-1 mb-4">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{s.cantidadActualKg.toLocaleString()}</span>
                                        <span className="text-sm text-gray-500 mb-2">/ {s.capacidadKg.toLocaleString()} Kg</span>
                                    </div>

                                    {/* Visual Bar */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${percent < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-sm text-gray-500 mb-6">
                                        <span>{percent.toFixed(1)}% Lleno</span>
                                        <span>PPP: ${s.precioPromedioCompra.toFixed(2)}</span>
                                    </div>

                                    {isAdmin && (
                                        <button
                                            onClick={() => handleOpenCarga(s)}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Database size={18} />
                                            Registrar Carga
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Modal isOpen={isCargaModalOpen} onClose={() => setIsCargaModalOpen(false)} title="Cargar Silo">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Cantidad (Kg)</label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Costo Total ($)</label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
                            <p className="text-xs text-gray-500 mt-1">Ingrese el costo total de la compra.</p>
                        </div>
                        <button onClick={submitCarga} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Guardar Carga</button>
                    </div>
                </Modal>
            </main>
        </div>
    );
}
