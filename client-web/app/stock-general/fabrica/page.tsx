'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

interface Silo {
    siloId: number;
    nombre: string;
    cantidadActualKg: number;
    producto?: { nombre: string };
}

export default function FabricaPage() {
    const { user } = useAuth();
    const [silos, setSilos] = useState<Silo[]>([]);
    const [mode, setMode] = useState<'Produccion' | 'Venta'>('Produccion');

    // Form State
    const [sourceSilo, setSourceSilo] = useState('');
    const [destSilo, setDestSilo] = useState(''); // Optional for production
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState(''); // For Venta

    const fetchSilos = async () => {
        try {
            const res = await api.get('/stock-general/silos');
            setSilos(res.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchSilos();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quantity || !sourceSilo) return;

        try {
            if (mode === 'Produccion') {
                await api.post('/stock-general/fabrica/produccion', {
                    siloOrigenId: parseInt(sourceSilo),
                    siloDestinoId: destSilo ? parseInt(destSilo) : null,
                    cantidadKg: parseFloat(quantity),
                    usuarioId: user?.UsuarioId
                    // Observacion?
                });
                alert('Producción registrada');
            } else {
                // Venta
                await api.post('/stock-general/fabrica/venta', {
                    siloId: parseInt(sourceSilo),
                    cantidadKg: parseFloat(quantity),
                    precioTotal: parseFloat(price)
                    // client?
                });
                alert('Venta Fabrica registrada');
            }
            setQuantity(''); setPrice('');
            fetchSilos(); // refresh stock
        } catch (error) {
            alert('Error al registrar operación');
        }
    };

    const isAdmin = user?.Rol === 'Admin';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Fábrica</h1>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setMode('Produccion')}
                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${mode === 'Produccion' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                        >
                            Registrar Producción
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setMode('Venta')}
                                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${mode === 'Venta' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                            >
                                Venta de Fábrica
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Silo Origen (Materia Prima)</label>
                            <select
                                value={sourceSilo}
                                onChange={(e) => setSourceSilo(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                required
                            >
                                <option value="">Seleccione Silo...</option>
                                {silos.map(s => (
                                    <option key={s.siloId} value={s.siloId}>
                                        {s.nombre} ({s.producto?.nombre}) - {s.cantidadActualKg} Kg Disp.
                                    </option>
                                ))}
                            </select>
                        </div>

                        {mode === 'Produccion' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Silo Destino (Opcional - si se guarda)</label>
                                <select
                                    value={destSilo}
                                    onChange={(e) => setDestSilo(e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">Consumo inmediato / Sin destino</option>
                                    {silos.map(s => (
                                        <option key={s.siloId} value={s.siloId}>
                                            {s.nombre} ({s.producto?.nombre})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Cantidad (Kg)</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                required
                            />
                        </div>

                        {mode === 'Venta' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Precio Total ($)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </div>
                        )}

                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95">
                            Confirmar {mode}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
