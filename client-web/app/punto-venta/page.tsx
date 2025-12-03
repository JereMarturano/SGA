'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, User, CreditCard, Check, ArrowLeft, Search, Plus, Truck, Wallet } from 'lucide-react';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';
import api from '@/lib/axios';

// Interfaces
interface Cliente {
    clienteId: number;
    nombre: string;
    direccion: string;
}

interface Producto {
    productoId: number;
    nombre: string;
    precio: number;
    stockActual: number;
    esHuevo: boolean;
}

interface Vehiculo {
    vehiculoId: number;
    patente: string;
    marca: string;
    modelo: string;
}

// Mock data (fallback)
const productosMock = [
    { productoId: 1, nombre: 'Huevo Grande Blanco', precio: 4500, stockActual: 100, esHuevo: true },
    { productoId: 2, nombre: 'Huevo Mediano Color', precio: 4200, stockActual: 100, esHuevo: true },
    { productoId: 3, nombre: 'Huevo Jumbo', precio: 5000, stockActual: 100, esHuevo: true },
];

export default function PuntoVentaPage() {
    const [step, setStep] = useState(1); // 1: Datos, 2: Productos, 3: Confirmación
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
    const [selectedVehiculo, setSelectedVehiculo] = useState<number | ''>('');
    const [cart, setCart] = useState<{ productoId: number; cantidad: number; precio: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [metodoPago, setMetodoPago] = useState<number>(0); // 0: Efectivo
    const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Try fetching from API
                const [clientesRes, productosRes, vehiculosRes] = await Promise.all([
                    api.get('/clientes'),
                    api.get('/productos'),
                    api.get('/vehiculos')
                ]);

                setClientes(clientesRes.data);
                setProductos(productosRes.data);
                setVehiculos(vehiculosRes.data);

                // Set default vehicle if exists
                if (vehiculosRes.data.length > 0) {
                    setSelectedVehiculo(vehiculosRes.data[0].vehiculoId);
                }

                setLoadingData(false);
            } catch (error) {
                console.error('Error fetching data, using mocks/empty', error);
                // Fallback or error handling
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const addToCart = (producto: Producto) => {
        const existing = cart.find((i) => i.productoId === producto.productoId);
        if (existing) {
            setCart(cart.map((i) => (i.productoId === producto.productoId ? { ...i, cantidad: i.cantidad + 1 } : i)));
        } else {
            setCart([...cart, { productoId: producto.productoId, cantidad: 1, precio: producto.precio }]); // Assuming price comes from product or logic
            // Note: In real world, price might depend on client list price. For now using base price.
        }
    };

    const removeFromCart = (id: number) => {
        setCart(cart.filter((i) => i.productoId !== id));
    };

    const subtotal = cart.reduce((acc, item) => acc + item.cantidad * item.precio, 0);
    const descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    const total = subtotal - descuentoMonto;

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredProductos = productos.filter(p => p.esHuevo); // Only eggs as per requirement

    const handleConfirmVenta = async () => {
        if (!selectedCliente || !selectedVehiculo) {
            alert("Falta seleccionar cliente o vehículo");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                clienteId: selectedCliente,
                usuarioId: 1, // Hardcoded for now
                vehiculoId: Number(selectedVehiculo),
                metodoPago: metodoPago,
                fecha: new Date().toISOString(),
                descuentoPorcentaje: descuentoPorcentaje,
                items: cart.map(item => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                    precioUnitario: item.precio
                }))
            };

            await api.post('/ventas', payload);
            alert('Venta Registrada Exitosamente!');
            // Reset
            setCart([]);
            setStep(1);
            setSelectedCliente(null);
            setDescuentoPorcentaje(0);
        } catch (error) {
            console.error(error);
            alert('Error al registrar la venta');
        } finally {
            setSubmitting(false);
        }
    };

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

                {/* Paso 1: Selección de Cliente y Vehiculo */}
                {step === 1 && (
                    <div className="space-y-4">
                        {/* Vehículo Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehículo de venta</label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-3 text-gray-400" size={20} />
                                <select
                                    value={selectedVehiculo}
                                    onChange={(e) => setSelectedVehiculo(Number(e.target.value))}
                                    className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                >
                                    <option value="">Seleccionar Vehículo</option>
                                    {vehiculos.map(v => (
                                        <option key={v.vehiculoId} value={v.vehiculoId}>{v.marca} {v.modelo} ({v.patente})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

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
                            {loadingData ? <p className="text-center p-4">Cargando...</p> : filteredClientes.map((cliente) => (
                                <button
                                    key={cliente.clienteId}
                                    onClick={() => {
                                        setSelectedCliente(cliente.clienteId);
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
                            {filteredProductos.length === 0 && <p>No hay productos disponibles.</p>}
                            {filteredProductos.map((prod) => (
                                <div key={prod.productoId} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{prod.nombre}</p>
                                        <p className="text-blue-600 font-bold">${prod.precio}</p>
                                        <p className="text-xs text-gray-500">Stock: {prod.stockActual}</p>
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
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">${subtotal.toLocaleString()}</span>
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
                                    const prod = productos.find(p => p.productoId === item.productoId);
                                    return (
                                        <div key={item.productoId} className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{item.cantidad}x {prod?.nombre}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">${(item.cantidad * item.precio).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Descuentos */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aplicar Descuento</label>
                                <div className="flex gap-2">
                                    {[0, 5, 10].map((disc) => (
                                        <button
                                            key={disc}
                                            onClick={() => setDescuentoPorcentaje(disc)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${descuentoPorcentaje === disc
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {disc === 0 ? 'Sin desc.' : `${disc}%`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toLocaleString()}</span>
                                </div>
                                {descuentoPorcentaje > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Descuento ({descuentoPorcentaje}%)</span>
                                        <span>-${descuentoMonto.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <span>Total a Pagar</span>
                                    <span>${total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setMetodoPago(0)}
                                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${metodoPago === 0 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                    <Wallet size={24} />
                                    Efectivo
                                </button>
                                <button
                                    onClick={() => setMetodoPago(1)}
                                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${metodoPago === 1 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                    <CreditCard size={24} />
                                    MercadoPago
                                </button>
                                <button
                                    onClick={() => setMetodoPago(3)}
                                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${metodoPago === 3 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                    <User size={24} />
                                    Cta. Corriente
                                </button>
                            </div>
                        </div>

                        <button
                            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 hover:bg-green-700 transition-colors flex justify-center items-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleConfirmVenta}
                            disabled={submitting}
                        >
                            <Check size={24} />
                            {submitting ? 'Registrando...' : 'Confirmar Venta'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
