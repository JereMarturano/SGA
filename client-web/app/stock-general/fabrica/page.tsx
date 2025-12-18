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
    const [ingredients, setIngredients] = useState<{ siloId: string; quantity: string }[]>([
        { siloId: '', quantity: '' }
    ]);
    const [destSilo, setDestSilo] = useState(''); // Optional for production
    const [totalQuantity, setTotalQuantity] = useState(''); // For Venta (manual) or display in Production
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

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { siloId: '', quantity: '' }]);
    };

    const handleRemoveIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleIngredientChange = (index: number, field: 'siloId' | 'quantity', value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);

        // Update total quantity based on ingredients
        if (mode === 'Produccion') {
            const sum = newIngredients.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
            setTotalQuantity(sum.toString());
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (mode === 'Produccion') {
                const validIngredients = ingredients.filter(i => i.siloId && i.quantity);
                if (validIngredients.length === 0) {
                    alert('Debe agregar al menos un ingrediente');
                    return;
                }

                await api.post('/stock-general/fabrica/produccion', {
                    ingredientes: validIngredients.map(i => ({
                        siloId: parseInt(i.siloId),
                        cantidadKg: parseFloat(i.quantity)
                    })),
                    siloDestinoId: destSilo ? parseInt(destSilo) : null,
                    cantidadKg: parseFloat(totalQuantity),
                    usuarioId: user?.UsuarioId
                });
                alert('Producción registrada');
            } else {
                // Venta
                if (!ingredients[0].siloId || !totalQuantity) return;
                await api.post('/stock-general/fabrica/venta', {
                    siloId: parseInt(ingredients[0].siloId),
                    cantidadKg: parseFloat(totalQuantity),
                    precioTotal: parseFloat(price)
                });
                alert('Venta Fabrica registrada');
            }
            setIngredients([{ siloId: '', quantity: '' }]);
            setTotalQuantity('');
            setPrice('');
            setDestSilo('');
            fetchSilos(); // refresh stock
        } catch (error) {
            alert('Error al registrar operación');
        }
    };

    const isAdmin = user?.Rol === 'Admin';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Fábrica</h1>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => { setMode('Produccion'); setTotalQuantity(''); }}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${mode === 'Produccion' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-105' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                        >
                            Registrar Producción
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => { setMode('Venta'); setIngredients([{ siloId: '', quantity: '' }]); }}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${mode === 'Venta' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-105' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                            >
                                Venta de Fábrica
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {mode === 'Produccion' ? 'Ingredientes (Materia Prima)' : 'Silo de Origen'}
                            </label>

                            {mode === 'Produccion' ? (
                                <div className="space-y-3">
                                    {ingredients.map((ing, index) => (
                                        <div key={index} className="flex gap-3 items-end animate-in fade-in slide-in-from-left-2 duration-300">
                                            <div className="flex-1">
                                                <select
                                                    value={ing.siloId}
                                                    onChange={(e) => handleIngredientChange(index, 'siloId', e.target.value)}
                                                    className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 transition-all"
                                                    required
                                                >
                                                    <option value="">Seleccione Silo...</option>
                                                    {silos.map(s => (
                                                        <option key={s.siloId} value={s.siloId}>
                                                            {s.nombre} ({s.producto?.nombre}) - {s.cantidadActualKg.toLocaleString()} Kg
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    placeholder="Kg"
                                                    value={ing.quantity}
                                                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                                    className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                            {ingredients.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveIngredient(index)}
                                                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                >
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleAddIngredient}
                                        className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 hover:underline p-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Agregar Ingrediente
                                    </button>
                                </div>
                            ) : (
                                <select
                                    value={ingredients[0].siloId}
                                    onChange={(e) => handleIngredientChange(0, 'siloId', e.target.value)}
                                    className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Seleccione Silo...</option>
                                    {silos.map(s => (
                                        <option key={s.siloId} value={s.siloId}>
                                            {s.nombre} ({s.producto?.nombre}) - {s.cantidadActualKg.toLocaleString()} Kg
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {mode === 'Produccion' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Silo Destino</label>
                                    <select
                                        value={destSilo}
                                        onChange={(e) => setDestSilo(e.target.value)}
                                        className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Consumo inmediato / Sin destino</option>
                                        {silos.map(s => (
                                            <option key={s.siloId} value={s.siloId}>
                                                {s.nombre} ({s.producto?.nombre})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Total Producción (Kg)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={totalQuantity}
                                            readOnly={mode === 'Produccion'}
                                            onChange={(e) => setTotalQuantity(e.target.value)}
                                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${mode === 'Produccion' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 font-bold text-blue-700 dark:text-blue-400' : 'bg-gray-50 dark:bg-gray-700 dark:border-gray-600'}`}
                                            placeholder="0"
                                        />
                                        {mode === 'Produccion' && <span className="absolute right-3 top-3 text-xs text-blue-400 uppercase font-bold">Autocalculado</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {mode === 'Venta' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Cantidad a Vender (Kg)</label>
                                    <input
                                        type="number"
                                        value={totalQuantity}
                                        onChange={(e) => setTotalQuantity(e.target.value)}
                                        className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Precio Total ($)</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 font-bold text-green-600"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`w-full py-4 rounded-xl font-black text-xl shadow-xl transition-all active:scale-95 ${mode === 'Produccion' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                            CONFIRMAR {mode.toUpperCase()}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
