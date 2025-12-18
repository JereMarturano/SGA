'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Egg, ArrowRight } from 'lucide-react';
import Modal from '@/components/Modal';

interface Galpon {
    galponId: number;
    nombre: string;
    tipo: string;
    cantidadAves: number;
}

export default function PollitosPage() {
    const { user } = useAuth();
    const [pollitosSheds, setPollitosSheds] = useState<Galpon[]>([]);
    const [productionSheds, setProductionSheds] = useState<Galpon[]>([]);

    // Modal State
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [selectedOrigin, setSelectedOrigin] = useState<Galpon | null>(null);
    const [selectedDest, setSelectedDest] = useState('');
    const [amount, setAmount] = useState('');

    const fetchGalpones = async () => {
        try {
            const res = await api.get('/stock-general/galpones');
            setPollitosSheds(res.data.filter((g: any) => g.tipo === 'Pollitos'));
            setProductionSheds(res.data.filter((g: any) => g.tipo === 'Produccion'));
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchGalpones();
    }, []);

    const openTransfer = (origin: Galpon) => {
        setSelectedOrigin(origin);
        setSelectedDest('');
        setAmount('');
        setIsTransferOpen(true);
    };

    const submitTransfer = async () => {
        if (!selectedOrigin || !selectedDest || !amount) return;
        try {
            await api.post('/stock-general/galpones/transferir-pollitos', {
                galponOrigenId: selectedOrigin.galponId,
                galponDestinoId: parseInt(selectedDest),
                cantidad: parseInt(amount)
            });
            setIsTransferOpen(false);
            fetchGalpones();
            alert('Transferencia exitosa');
        } catch (error) {
            alert('Error en transferencia');
        }
    };

    const isAdmin = user?.Rol === 'Admin';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                    <Egg className="text-pink-500" />
                    Habitación de Pollitos (Crianza)
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pollitosSheds.map(g => (
                        <div key={g.galponId} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-pink-100 dark:border-pink-900">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{g.nombre}</h3>
                                <span className="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full">Crianza</span>
                            </div>

                            <div className="mt-4 text-3xl font-bold text-pink-600">{g.cantidadAves.toLocaleString()} <span className="text-sm text-gray-500">pollitos</span></div>

                            {isAdmin && (
                                <button
                                    onClick={() => openTransfer(g)}
                                    className="mt-6 w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg flex items-center justify-center gap-2"
                                >
                                    Transferir a Producción
                                    <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Transferir a Galpón de Producción">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">Transfiriendo desde <strong>{selectedOrigin?.nombre}</strong></p>
                        <div>
                            <label className="block text-sm font-medium mb-1">Galpón Destino</label>
                            <select value={selectedDest} onChange={(e) => setSelectedDest(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Seleccione destino...</option>
                                {productionSheds.map(s => (
                                    <option key={s.galponId} value={s.galponId}>{s.nombre} (Stock: {s.cantidadAves})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Cantidad a Transferir</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <button onClick={submitTransfer} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Confirmar Transferencia</button>
                    </div>
                </Modal>
            </main>
        </div>
    );
}
