'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Egg, ArrowRight, Edit2, Activity, TrendingUp, Skull, Syringe, Wheat, DollarSign } from 'lucide-react';
import Modal from '@/components/Modal';
import KPICard from '@/components/KPICard';

interface Galpon {
    galponId: number;
    nombre: string;
    tipo: string;
    cantidadAves: number;
    precioCompraAve: number;
}

interface GalponStats {
    cantidadInicial: number;
    stockActual: number;
    totalInversion: number;
    gastosOperativos: number;
    costoPromedio: number;
    muertes: number;
    mortalidadPorcentaje: number;
    consumoAlimento: number;
}

interface Producto {
    productoId: number;
    nombre: string;
    stockActual: number;
    unidadDeMedida: string;
}

export default function PollitosPage() {
    const { user } = useAuth();
    const [pollitosSheds, setPollitosSheds] = useState<Galpon[]>([]);
    const [productionSheds, setProductionSheds] = useState<Galpon[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Producto[]>([]);

    // Modal State
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [selectedOrigin, setSelectedOrigin] = useState<Galpon | null>(null);
    const [selectedDest, setSelectedDest] = useState('');
    const [amount, setAmount] = useState('');

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editQuantity, setEditQuantity] = useState('');
    const [editTotalPrice, setEditTotalPrice] = useState('');

    // Control/Stats Modal State
    const [isControlOpen, setIsControlOpen] = useState(false);
    const [currentStats, setCurrentStats] = useState<GalponStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Event Form State
    const [eventType, setEventType] = useState<'Alimentacion' | 'Vacunacion' | 'Muerte'>('Alimentacion');
    const [eventAmount, setEventAmount] = useState('');
    const [eventCost, setEventCost] = useState(''); // Optional if product selected
    const [selectedProduct, setSelectedProduct] = useState('');
    const [eventObs, setEventObs] = useState('');

    const fetchGalpones = useCallback(async () => {
        try {
            const res = await api.get('/stock-general/galpones');
            setPollitosSheds(res.data.filter((g: any) => g.tipo === 'Pollitos'));
            setProductionSheds(res.data.filter((g: any) => g.tipo === 'Produccion'));
        } catch (error) { console.error(error); }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await api.get('/stock-general/deposito'); // Reusing existing endpoint that returns products
            setAvailableProducts(res.data);
        } catch (error) { console.error(error); }
    }, []);

    useEffect(() => {
        fetchGalpones();
        fetchProducts();
    }, [fetchGalpones, fetchProducts]);

    const fetchStats = async (id: number) => {
        setLoadingStats(true);
        try {
            const res = await api.get(`/stock-general/galpones/${id}/estadisticas`);
            setCurrentStats(res.data);
        } catch (error) {
            console.error(error);
            alert('Error al cargar estadísticas');
        } finally {
            setLoadingStats(false);
        }
    };

    const openTransfer = (origin: Galpon) => {
        setSelectedOrigin(origin);
        setSelectedDest('');
        setAmount('');
        setIsTransferOpen(true);
    };

    const openEdit = (galpon: Galpon) => {
        setSelectedOrigin(galpon);
        setEditName(galpon.nombre);
        setEditQuantity(galpon.cantidadAves.toString());
        // Calculate existing total from unit price
        const total = (galpon.cantidadAves * (galpon.precioCompraAve || 0));
        setEditTotalPrice(total > 0 ? total.toFixed(2) : '');
        setIsEditOpen(true);
    };

    const openControl = (galpon: Galpon) => {
        setSelectedOrigin(galpon);
        setIsControlOpen(true);
        fetchStats(galpon.galponId);
        // Reset form
        setEventAmount('');
        setEventCost('');
        setSelectedProduct('');
        setEventObs('');
        setEventType('Alimentacion');
    };

    const handleUpdate = async () => {
        if (!selectedOrigin || !editName || editQuantity === '') return;

        const qty = parseInt(editQuantity);
        const total = parseFloat(editTotalPrice || '0');
        // Calculate new unit price: Total / Qty
        const unitPrice = qty > 0 ? (total / qty) : 0;

        try {
            await api.put(`/stock-general/galpones/${selectedOrigin.galponId}`, {
                ...selectedOrigin,
                nombre: editName,
                cantidadAves: qty,
                precioCompraAve: unitPrice
            });
            setIsEditOpen(false);
            fetchGalpones();
            alert('Actualizado correctamente');
        } catch (error) {
            alert('Error al actualizar');
        }
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

    const submitEvent = async () => {
        if (!selectedOrigin || !eventAmount) return;

        const payload: any = {
            GalponId: selectedOrigin.galponId,
            TipoEvento: eventType,
            Cantidad: parseInt(eventAmount),
            Observacion: eventObs,
            Costo: eventCost ? parseFloat(eventCost) : 0,
        };

        if (selectedProduct) {
            payload.ProductoId = parseInt(selectedProduct);
        }

        try {
            await api.post(`/stock-general/galpones/${selectedOrigin.galponId}/eventos`, payload);
            alert('Evento registrado correctamente');
            setEventAmount('');
            setEventCost('');
            setEventObs('');
            // Refresh stats
            fetchStats(selectedOrigin.galponId);
            fetchGalpones(); // Update global count if death
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Error al registrar evento';
            alert(msg);
        }
    };

    const isAdmin = user?.Rol === 'Admin';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Egg className="text-pink-500 w-8 h-8" />
                            Gestión de Crianza (Pollitos)
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Control de seguimiento, costos inteligentes y mortalidad.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pollitosSheds.map(g => (
                        <div key={g.galponId} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-pink-100 dark:border-pink-900/30 overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{g.nombre}</h3>
                                    <span className="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full font-medium">Crianza</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-4xl font-extrabold text-pink-600">{g.cantidadAves.toLocaleString()}</span>
                                    <span className="text-gray-500 text-sm">pollitos vivos</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <button
                                        onClick={() => openControl(g)}
                                        className="py-2.5 px-4 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Activity size={16} />
                                        Control y Costos
                                    </button>
                                    {isAdmin && (
                                        <button
                                            onClick={() => openEdit(g)}
                                            className="py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-transparent dark:border-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                            Editar
                                        </button>
                                    )}
                                </div>

                                {isAdmin && (
                                    <button
                                        onClick={() => openTransfer(g)}
                                        className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 transition-all"
                                    >
                                        Transferir a Producción
                                        <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Control Modal */}
                <Modal isOpen={isControlOpen} onClose={() => setIsControlOpen(false)} title={`Tablero de Control: ${selectedOrigin?.nombre}`}>
                    <div className="space-y-8 max-w-4xl mx-auto">

                        {/* KPIs */}
                        {loadingStats ? (
                            <div className="text-center py-8 text-gray-500">Cargando estadísticas...</div>
                        ) : currentStats && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <KPICard
                                    title="Costo Promedio / Pollito"
                                    value={`$${currentStats.costoPromedio.toFixed(2)}`}
                                    icon={DollarSign}
                                    color="blue"
                                />
                                <KPICard
                                    title="Mortalidad"
                                    value={`${currentStats.muertes} (${currentStats.mortalidadPorcentaje.toFixed(2)}%)`}
                                    icon={Skull}
                                    color={currentStats.mortalidadPorcentaje > 5 ? 'red' : 'green'}
                                />
                                <KPICard
                                    title="Inversión Total"
                                    value={`$${currentStats.totalInversion.toLocaleString()}`}
                                    icon={TrendingUp}
                                    color="purple"
                                />
                            </div>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Activity className="text-blue-500" size={20} />
                                Registrar Evento
                            </h3>

                            <div className="flex gap-2 mb-6 p-1 bg-white dark:bg-gray-800 rounded-lg w-fit border border-gray-200 dark:border-gray-600">
                                <button onClick={() => setEventType('Alimentacion')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${eventType === 'Alimentacion' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                                    <div className="flex items-center gap-2"><Wheat size={16} /> Alimentación</div>
                                </button>
                                <button onClick={() => setEventType('Vacunacion')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${eventType === 'Vacunacion' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                                    <div className="flex items-center gap-2"><Syringe size={16} /> Vacunación</div>
                                </button>
                                <button onClick={() => setEventType('Muerte')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${eventType === 'Muerte' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                                    <div className="flex items-center gap-2"><Skull size={16} /> Mortalidad</div>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cantidad {eventType === 'Muerte' ? '(Aves)' : (eventType === 'Alimentacion' ? '(Kg/Bolsas)' : '(Dosis)')}</label>
                                    <input type="number" value={eventAmount} onChange={(e) => setEventAmount(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                                </div>

                                {eventType !== 'Muerte' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Producto (Stock)</label>
                                            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none">
                                                <option value="">-- Sin descontar stock --</option>
                                                {availableProducts.map(p => (
                                                    <option key={p.productoId} value={p.productoId}>{p.nombre} (Stock: {p.stockActual} {p.unidadDeMedida})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Costo Total ($)</label>
                                            <input type="number" value={eventCost} onChange={(e) => setEventCost(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={selectedProduct ? "Auto-calcular" : "0.00"} />
                                            <p className="text-xs text-gray-500 mt-1">Si se selecciona producto, se puede dejar vacío para usar costo de sistema.</p>
                                        </div>
                                    </>
                                )}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Observación</label>
                                    <input type="text" value={eventObs} onChange={(e) => setEventObs(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Detalles opcionales..." />
                                </div>
                            </div>

                            <button onClick={submitEvent} className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/20 transition-all">
                                Registrar {eventType}
                            </button>
                        </div>
                    </div>
                </Modal>

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

                <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Habitación">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cantidad de Pollitos</label>
                            <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Precio Total ($)</label>
                            <input
                                type="number"
                                value={editTotalPrice}
                                onChange={(e) => setEditTotalPrice(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                                El costo unitario se calculará automáticamente: {editQuantity && editTotalPrice ? `$${(parseFloat(editTotalPrice) / parseInt(editQuantity)).toFixed(2)} / pollito` : '-'}
                            </p>
                        </div>
                        <button
                            onClick={handleUpdate}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </Modal>
            </main>
        </div>
    );
}
