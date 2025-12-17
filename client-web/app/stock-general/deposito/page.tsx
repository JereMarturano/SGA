'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import Modal from '@/components/Modal';
import { Plus, Minus, ArrowRightLeft } from 'lucide-react';

interface Producto {
    productoId: number;
    nombre: string;
    stockActual: number;
    unidadDeMedida: string;
    costoUltimaCompra: number;
}

export default function DepositoPage() {
    const { user } = useAuth();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProd, setSelectedProd] = useState<Producto | null>(null);
    const [moveType, setMoveType] = useState<'Ingreso' | 'AjusteInventario'>('Ingreso');
    const [amount, setAmount] = useState('');
    const [obs, setObs] = useState('');

    const fetchProductos = async () => {
        try {
            const res = await api.get('/stock-general/deposito');
            setProductos(res.data);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    const handleOpen = (prod: Producto, type: 'Ingreso' | 'AjusteInventario') => {
        setSelectedProd(prod);
        setMoveType(type);
        setAmount('');
        setObs('');
        setIsModalOpen(true);
    };

    const submitMovimiento = async () => {
        if (!selectedProd || !amount) return;
        try {
            await api.post('/stock-general/deposito/movimiento', {
                productoId: selectedProd.productoId,
                tipoMovimiento: moveType,
                cantidad: parseInt(amount),
                observaciones: obs
            });
            setIsModalOpen(false);
            fetchProductos();
        } catch (error) {
            alert('Error registrando movimiento');
        }
    };

    const isAdmin = user?.Rol === 'Admin' || user?.Rol === 'Encargado';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Depósito General</h1>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ultimo Costo</th>
                                {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {productos.map(p => (
                                <tr key={p.productoId}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        <span className={`font-bold ${p.stockActual < 50 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {p.stockActual.toLocaleString()}
                                        </span> {p.unidadDeMedida}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        ${p.costoUltimaCompra.toLocaleString()}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpen(p, 'Ingreso')} className="text-green-600 hover:text-green-900 mr-4" title="Ingresar Stock">
                                                <Plus size={18} />
                                            </button>
                                            <button onClick={() => handleOpen(p, 'AjusteInventario')} className="text-orange-600 hover:text-orange-900" title="Ajuste / Salida">
                                                <Minus size={18} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Registrar ${moveType} - ${selectedProd?.nombre}`}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Cantidad ({selectedProd?.unidadDeMedida})</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Observación</label>
                            <input value={obs} onChange={(e) => setObs(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <button onClick={submitMovimiento} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Confirmar</button>
                    </div>
                </Modal>
            </main>
        </div>
    );
}
