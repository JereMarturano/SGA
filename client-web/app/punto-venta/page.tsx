'use client';

import { useState } from 'react';
import { ShoppingCart, User, CreditCard, Check, ArrowLeft, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';

// Mock data
const clientes = [
    { id: 1, nombre: 'Almacén Don Pepe', direccion: 'Av. Colon 1234' },
    { id: 2, nombre: 'Supermercado El Sol', direccion: 'San Martin 500' },
    { id: 3, nombre: 'Panadería La Espiga', direccion: 'Belgrano 200' },
];

const productos = [
    { id: 1, nombre: 'Huevo Grande Blanco', precio: 4500 },
    { id: 2, nombre: 'Huevo Mediano Color', precio: 4200 },
    { id: 3, nombre: 'Huevo Jumbo', precio: 5000 },
];

export default function PuntoVentaPage() {
    const [step, setStep] = useState(1); // 1: Cliente, 2: Productos, 3: Confirmación
    const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
    const [cart, setCart] = useState<{ productoId: number; cantidad: number; precio: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const addToCart = (producto: any) => {
        const existing = cart.find((i) => i.productoId === producto.id);
        if (existing) {
            setCart(cart.map((i) => (i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)));
        } else {
            setCart([...cart, { productoId: producto.id, cantidad: 1, precio: producto.precio }]);
        }
    };

    const removeFromCart = (id: number) => {
        setCart(cart.filter((i) => i.productoId !== id));
    };

    const total = cart.reduce((acc, item) => acc + item.cantidad * item.precio, 0);

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Venta</h1>
                <div className="ml-auto flex items-center gap-4">
                    <NotificationBell />
                    <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Paso {step}/3</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 max-w-lg mx-auto w-full">

                {/* Paso 1: Selección de Cliente */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            {filteredClientes.map((cliente) => (
                                <button
                                    key={cliente.id}
                                    onClick={() => {
                                        setSelectedCliente(cliente.id);
                                        setStep(2);
                                    }}
                                    className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-all flex items-center gap-4 group"
                                >
                                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                        <User size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{cliente.nombre}</p>
                                        <p className="text-sm text-gray-500">{cliente.direccion}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Paso 2: Selección de Productos */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-3">
                            {productos.map((prod) => (
                                <div key={prod.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{prod.nombre}</p>
                                        <p className="text-blue-600 font-bold">${prod.precio}</p>
                                    </div>
                                    <button
                                        onClick={() => addToCart(prod)}
                                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Resumen Carrito Flotante */}
                        {cart.length > 0 && (
                            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-lg">
                                <div className="max-w-lg mx-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-500">Total ({cart.reduce((a, b) => a + b.cantidad, 0)} items)</span>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">${total.toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
                                    >
                                        Continuar al Pago
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Paso 3: Confirmación y Pago */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Resumen del Pedido</h3>
                            <div className="space-y-3 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                                {cart.map((item) => {
                                    const prod = productos.find(p => p.id === item.productoId);
                                    return (
                                        <div key={item.productoId} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{item.cantidad}x {prod?.nombre}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">${(item.cantidad * item.precio).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white">
                                <span>Total a Pagar</span>
                                <span>${total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium flex flex-col items-center gap-2">
                                    <CreditCard size={24} />
                                    Efectivo
                                </button>
                                <button className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 text-gray-600 dark:text-gray-400 font-medium flex flex-col items-center gap-2">
                                    <User size={24} />
                                    Cta. Corriente
                                </button>
                            </div>
                        </div>

                        <button
                            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 hover:bg-green-700 transition-colors flex justify-center items-center gap-2 mt-8"
                            onClick={() => alert('Venta Registrada!')}
                        >
                            <Check size={24} />
                            Confirmar Venta
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
