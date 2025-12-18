'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import Modal from '@/components/Modal';
import { Plus, Minus, ArrowRightLeft, Edit } from 'lucide-react';

interface Producto {
    productoId: number;
    nombre: string;
    stockActual: number;
    unidadDeMedida: string;
    costoUltimaCompra: number;
    esHuevo: boolean;
    unidadesPorBulto: number;
}

export default function DepositoPage() {
    const { user } = useAuth();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal Movimiento
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProd, setSelectedProd] = useState<Producto | null>(null);
    const [moveType, setMoveType] = useState<'Ingreso' | 'AjusteInventario'>('Ingreso');
    const [amount, setAmount] = useState('');
    const [obs, setObs] = useState('');
    const [modalUnit, setModalUnit] = useState<'Maple' | 'Cajon' | 'Original'>('Original');

    // Display Units state
    const [viewUnits, setViewUnits] = useState<Record<number, 'Maple' | 'Cajon'>>({});

    // Price Edit Modal
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [priceAmount, setPriceAmount] = useState('');

    // New Product Modal
    const [isNewProdModalOpen, setIsNewProdModalOpen] = useState(false);
    const [newProd, setNewProd] = useState({
        nombre: '',
        tipoProducto: 1, // Default Insumo (0:Huevo, 1:Insumo, 2:Envase)
        unidadDeMedida: 'Unidades',
        stockMinimoAlerta: 0,
        unidadesPorBulto: 1,
        esHuevo: false,
        costoUltimaCompra: 0
    });

    const fetchProductos = async () => {
        try {
            const res = await api.get('/stock-general/deposito');
            const data = res.data;
            setProductos(data);

            // Initialize view units for eggs
            const initialUnits: Record<number, 'Maple' | 'Cajon'> = {};
            data.forEach((p: Producto) => {
                if (p.esHuevo) initialUnits[p.productoId] = 'Maple';
            });
            setViewUnits((prev) => ({ ...initialUnits, ...prev }));
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    const toggleUnit = (productId: number) => {
        setViewUnits(prev => ({
            ...prev,
            [productId]: prev[productId] === 'Maple' ? 'Cajon' : 'Maple'
        }));
    };

    const handleOpen = (prod: Producto, type: 'Ingreso' | 'AjusteInventario') => {
        setSelectedProd(prod);
        setMoveType(type);
        setAmount('');
        setObs('');
        setModalUnit(prod.esHuevo ? 'Maple' : 'Original');
        setIsModalOpen(true);
    };

    const submitMovimiento = async () => {
        if (!selectedProd || !amount) return;

        let finalCantidad = parseFloat(amount);
        if (selectedProd.esHuevo && modalUnit === 'Cajon') {
            finalCantidad = finalCantidad * 12; // 1 Cajon = 12 Maples
        }

        try {
            await api.post('/stock-general/deposito/movimiento', {
                productoId: selectedProd.productoId,
                tipoMovimiento: moveType,
                cantidad: finalCantidad,
                observaciones: obs
            });
            setIsModalOpen(false);
            fetchProductos();
        } catch (error) {
            alert('Error registrando movimiento');
        }
    };

    const submitPrecioUpdate = async () => {
        if (!selectedProd || !priceAmount) return;
        try {
            await api.put(`/stock-general/productos/${selectedProd.productoId}/precio`, {
                precio: parseFloat(priceAmount)
            });
            setIsPriceModalOpen(false);
            fetchProductos();
        } catch (error) {
            alert('Error actualizando precio');
        }
    };

    const submitNewProduct = async () => {
        if (!newProd.nombre) return;
        try {
            await api.post('/stock-general/productos', {
                ...newProd,
                stockActual: 0 // New product starts with 0 stock
            });
            setIsNewProdModalOpen(false);
            setNewProd({
                nombre: '',
                tipoProducto: 1,
                unidadDeMedida: 'Unidades',
                stockMinimoAlerta: 0,
                unidadesPorBulto: 1,
                esHuevo: false,
                costoUltimaCompra: 0
            });
            fetchProductos();
        } catch (error) {
            alert('Error creando producto');
        }
    };

    const isAdmin = user?.Rol === 'Admin' || user?.Rol === 'Encargado';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Depósito General</h1>
                    {isAdmin && (
                        <button
                            onClick={() => setIsNewProdModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all"
                        >
                            <Plus size={20} />
                            Nuevo Producto
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo (Ref)</th>
                                {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {productos.map(p => {
                                const currentViewUnit = viewUnits[p.productoId] || p.unidadDeMedida;
                                const isCajonView = currentViewUnit === 'Cajon';

                                let displayStock = p.stockActual;
                                let displayCost = p.costoUltimaCompra;

                                if (p.esHuevo && isCajonView) {
                                    displayStock = p.stockActual / 12;
                                    displayCost = p.costoUltimaCompra * 12;
                                }

                                return (
                                    <tr key={p.productoId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            <div className="font-bold">{p.nombre}</div>
                                            <div className="text-xs text-gray-400">ID: {p.productoId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${p.stockActual < 50 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {Number(displayStock.toFixed(2)).toLocaleString()}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">{currentViewUnit}</span>
                                                {p.esHuevo && (
                                                    <button
                                                        onClick={() => toggleUnit(p.productoId)}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-500"
                                                        title="Cambiar vista Maple / Cajon"
                                                    >
                                                        <ArrowRightLeft size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">${displayCost.toLocaleString()}</span>
                                                <span className="text-[10px] text-gray-400">/ {currentViewUnit}</span>
                                                {isAdmin && !p.esHuevo && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProd(p);
                                                            setPriceAmount(p.costoUltimaCompra.toString());
                                                            setIsPriceModalOpen(true);
                                                        }}
                                                        className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded transition-colors"
                                                        title="Editar Precio"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpen(p, 'Ingreso')} className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg hover:bg-green-100" title="Ingresar Stock">
                                                        <Plus size={18} />
                                                    </button>
                                                    <button onClick={() => handleOpen(p, 'AjusteInventario')} className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg hover:bg-orange-100" title="Ajuste / Salida">
                                                        <Minus size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Registrar ${moveType} - ${selectedProd?.nombre}`}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Cantidad</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Unidad</label>
                                {selectedProd?.esHuevo ? (
                                    <select
                                        value={modalUnit}
                                        onChange={(e) => setModalUnit(e.target.value as any)}
                                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        <option value="Maple">Maples</option>
                                        <option value="Cajon">Cajones</option>
                                    </select>
                                ) : (
                                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700 text-sm">{selectedProd?.unidadDeMedida}</div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Observación</label>
                            <input value={obs} onChange={(e) => setObs(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <button onClick={submitMovimiento} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20">Confirmar</button>
                    </div>
                </Modal>

                <Modal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} title={`Actualizar Precio - ${selectedProd?.nombre}`}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nuevo Precio (por {selectedProd?.unidadDeMedida})</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={priceAmount}
                                    onChange={(e) => setPriceAmount(e.target.value)}
                                    className="w-full p-2 pl-7 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                        </div>
                        <button onClick={submitPrecioUpdate} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20">Guardar Precio</button>
                    </div>
                </Modal>

                {/* Modal Nuevo Producto */}
                <Modal isOpen={isNewProdModalOpen} onClose={() => setIsNewProdModalOpen(false)} title="Crear Nuevo Producto">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre</label>
                            <input
                                value={newProd.nombre}
                                onChange={(e) => setNewProd({ ...newProd, nombre: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Ej: Maple físico, Cajón vacío, etc."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo</label>
                                <select
                                    value={newProd.tipoProducto}
                                    onChange={(e) => setNewProd({ ...newProd, tipoProducto: parseInt(e.target.value) })}
                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value={0}>Huevo</option>
                                    <option value={1}>Insumo</option>
                                    <option value={2}>Envase</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Unidad</label>
                                <input
                                    value={newProd.unidadDeMedida}
                                    onChange={(e) => setNewProd({ ...newProd, unidadDeMedida: e.target.value })}
                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Unidades, Maple, Kg..."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
                                <input
                                    type="number"
                                    value={newProd.stockMinimoAlerta}
                                    onChange={(e) => setNewProd({ ...newProd, stockMinimoAlerta: parseFloat(e.target.value) })}
                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Costo (Opcional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newProd.costoUltimaCompra}
                                    onChange={(e) => setNewProd({ ...newProd, costoUltimaCompra: parseFloat(e.target.value) })}
                                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input
                                        type="checkbox"
                                        checked={newProd.esHuevo}
                                        onChange={(e) => setNewProd({ ...newProd, esHuevo: e.target.checked })}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium">Es Huevo</span>
                                </label>
                            </div>
                        </div>
                        <button onClick={submitNewProduct} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Crear Producto</button>
                    </div>
                </Modal>
            </main>
        </div>
    );
}
