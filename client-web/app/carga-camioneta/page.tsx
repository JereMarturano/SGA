'use client';

import { useState } from 'react';
import { Truck, Package, Plus, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Mock data - Reemplazar con llamadas a API
const vehiculos = [
    { id: 1, nombre: 'Boxer - Patente AA123BB' },
    { id: 2, nombre: 'Fiorino - Patente CC456DD' },
];

const productos = [
    { id: 1, nombre: 'Huevo Grande Blanco (Maple)', tipo: 'Maple' },
    { id: 2, nombre: 'Huevo Mediano Color (Maple)', tipo: 'Maple' },
    { id: 3, nombre: 'Huevo Jumbo (Cajón)', tipo: 'Cajón' },
];

export default function CargaCamionetaPage() {
    const [selectedVehiculo, setSelectedVehiculo] = useState<number | null>(null);
    const [items, setItems] = useState<{ productoId: number; cantidad: number }[]>([]);

    const handleAddItem = () => {
        setItems([...items, { productoId: 1, cantidad: 0 }]);
    };

    const handleUpdateItem = (index: number, field: 'productoId' | 'cantidad', value: number) => {
        const newItems = [...items];
        // @ts-ignore
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // Aquí iría la llamada a la API
        console.log({ vehiculoId: selectedVehiculo, items });
        alert('Carga registrada exitosamente (Simulación)');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Truck className="text-blue-600" />
                        Carga de Camioneta
                    </h1>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                    {/* Selección de Vehículo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Seleccionar Vehículo
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {vehiculos.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setSelectedVehiculo(v.id)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${selectedVehiculo === v.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                        }`}
                                >
                                    <p className="font-semibold text-gray-900 dark:text-white">{v.nombre}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lista de Carga */}
                    {selectedVehiculo && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventario a Cargar</h3>
                                <button
                                    onClick={handleAddItem}
                                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={16} /> Agregar Producto
                                </button>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} className="flex gap-4 items-end bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Producto</label>
                                        <select
                                            value={item.productoId}
                                            onChange={(e) => handleUpdateItem(index, 'productoId', Number(e.target.value))}
                                            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            {productos.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                                        <input
                                            type="number"
                                            value={item.cantidad}
                                            onChange={(e) => handleUpdateItem(index, 'cantidad', Number(e.target.value))}
                                            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            {items.length === 0 && (
                                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    <Package className="mx-auto mb-2 opacity-50" />
                                    <p>Agrega productos para cargar al vehículo</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botón Guardar */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedVehiculo || items.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2"
                        >
                            <Save size={20} />
                            Confirmar Carga
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
