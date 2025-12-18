'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Plus, Minus, Skull, Edit, History, X } from 'lucide-react';
import Modal from '@/components/Modal';

interface Galpon {
    galponId: number;
    nombre: string;
    tipo: string;
    cantidadAves: number; // Current stock
    estado: string;
    fechaAlta: string;
}

interface EventoGalpon {
    eventoId: number;
    fecha: string;
    tipoEvento: string;
    cantidad: number;
    observacion: string;
    usuario?: { nombre: string };
}

export default function GalponesPage() {
    const { user } = useAuth();
    const [galpones, setGalpones] = useState<Galpon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGalpon, setSelectedGalpon] = useState<Galpon | null>(null);

    // Modal State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventType, setEventType] = useState<'Muerte' | 'Ingreso' | 'Egreso'>('Muerte');
    const [quantity, setQuantity] = useState('');
    const [obs, setObs] = useState('');

    // Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editStock, setEditStock] = useState('');

    // History State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [history, setHistory] = useState<EventoGalpon[]>([]);

    const fetchGalpones = async () => {
        try {
            const res = await api.get('/stock-general/galpones');
            setGalpones(res.data); // Should return list
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHistory = async (galponId: number) => {
        try {
            // Need endpoint. Assuming I can add it to Controller or filter client side if small.
            // Better: Add specific endpoint. For now, let's assume I add /galpones/{id}/eventos to Controller.
            // I will implement that in next step.
            const res = await api.get(`/stock-general/galpones/${galponId}/eventos`);
            setHistory(res.data);
        } catch (error) {
            console.error('Error fetching history', error);
            setHistory([]);
        }
    };

    useEffect(() => {
        fetchGalpones();
    }, []);

    const handleOpenEvent = (galpon: Galpon, type: 'Muerte' | 'Ingreso' | 'Egreso') => {
        setSelectedGalpon(galpon);
        setEventType(type);
        setQuantity('');
        setObs('');
        setIsEventModalOpen(true);
    };

    const handleOpenEdit = (galpon: Galpon) => {
        setSelectedGalpon(galpon);
        setEditName(galpon.nombre);
        setEditStock(galpon.cantidadAves.toString());
        setIsEditModalOpen(true);
    };

    const handleOpenHistory = async (galpon: Galpon) => {
        setSelectedGalpon(galpon);
        setIsHistoryOpen(true);
        await fetchHistory(galpon.galponId);
    };

    const submitEvent = async () => {
        if (!selectedGalpon || !quantity) return;
        try {
            await api.post(`/stock-general/galpones/${selectedGalpon.galponId}/eventos`, {
                galponId: selectedGalpon.galponId,
                tipoEvento: eventType,
                cantidad: parseInt(quantity),
                observacion: obs,
                usuarioId: user?.UsuarioId
            });
            setIsEventModalOpen(false);
            fetchGalpones();
        } catch (error) {
            alert('Error al registrar evento');
        }
    };

    const submitEdit = async () => {
        if (!selectedGalpon) return;
        try {
            await api.put(`/stock-general/galpones/${selectedGalpon.galponId}`, {
                ...selectedGalpon,
                nombre: editName,
                cantidadAves: parseInt(editStock)
            });
            setIsEditModalOpen(false);
            fetchGalpones();
        } catch (error) {
            alert('Error al editar');
        }
    };

    const isAdmin = user?.Rol === 'Admin';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Gestión de Galpones</h1>

                {isLoading ? (
                    <p>Cargando...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {galpones.filter(g => g.tipo !== 'Pollitos').map((g) => ( // Filter out Pollitos if shown in separate view
                            <div key={g.galponId} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 relative">
                                <button
                                    onClick={() => handleOpenHistory(g)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-blue-500"
                                    title="Ver Historial"
                                >
                                    <History size={20} />
                                </button>

                                <div className="flex justify-between items-start mb-4 pr-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{g.nombre}</h3>
                                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                            {g.tipo}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {g.cantidadAves.toLocaleString()} <span className="text-sm font-normal text-gray-500">aves</span>
                                </div>

                                {isAdmin && (
                                    <button onClick={() => handleOpenEdit(g)} className="text-xs text-blue-500 hover:underline mb-4 block">
                                        Editar / Ajuste Manual
                                    </button>
                                )}

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2 grid grid-cols-3 gap-2">
                                    <button onClick={() => handleOpenEvent(g, 'Muerte')} className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                                        <Skull size={20} className="mb-1" />
                                        <span className="text-xs font-medium">Muerte</span>
                                    </button>
                                    <button onClick={() => handleOpenEvent(g, 'Ingreso')} className="flex flex-col items-center justify-center p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors">
                                        <Plus size={20} className="mb-1" />
                                        <span className="text-xs font-medium">Ingreso</span>
                                    </button>
                                    <button onClick={() => handleOpenEvent(g, 'Egreso')} className="flex flex-col items-center justify-center p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors">
                                        <Minus size={20} className="mb-1" />
                                        <span className="text-xs font-medium">Egreso</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Event Modal */}
                <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title={`Registrar ${eventType} - ${selectedGalpon?.nombre}`}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Cantidad</label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" autoFocus />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Observación</label>
                            <textarea value={obs} onChange={(e) => setObs(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" rows={3} />
                        </div>
                        <button onClick={submitEvent} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Guardar</button>
                    </div>
                </Modal>

                {/* Edit Modal */}
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Galpón">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre</label>
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Cantidad Aves</label>
                            <input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <button onClick={submitEdit} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Guardar</button>
                    </div>
                </Modal>

                {/* History Modal (Side drawer style or full modal) */}
                <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`Historial - ${selectedGalpon?.nombre}`}>
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <p className="text-gray-500">No hay movimientos registrados.</p>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-2 py-2">Fecha</th>
                                        <th className="px-2 py-2">Tipo</th>
                                        <th className="px-2 py-2">Cant</th>
                                        <th className="px-2 py-2">Obs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(h => (
                                        <tr key={h.eventoId} className="border-b dark:border-gray-700">
                                            <td className="px-2 py-2">{new Date(h.fecha).toLocaleDateString()}</td>
                                            <td className="px-2 py-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${h.tipoEvento === 'Muerte' ? 'bg-red-100 text-red-700' :
                                                        h.tipoEvento === 'Ingreso' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {h.tipoEvento}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 font-bold">{h.cantidad}</td>
                                            <td className="px-2 py-2 text-xs text-gray-500">{h.observacion}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Modal>
            </main>
        </div>
    );
}
