'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Truck, User, ShoppingCart, DollarSign, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

// Interfaces
interface Vehiculo {
    vehiculoId: number;
    patente: string;
    marca: string;
    modelo: string;
}

interface Cliente {
    clienteId: number;
    nombre: string;
}

interface Producto {
    productoId: number;
    nombre: string;
    esHuevo: boolean;
}

export default function SimulacionVentasPage() {
    // Data states
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Form states
    const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
    const [hora, setHora] = useState<string>('12:00');
    const [selectedVehiculo, setSelectedVehiculo] = useState<number | ''>('');
    const [selectedCliente, setSelectedCliente] = useState<number | ''>('');
    const [selectedProducto, setSelectedProducto] = useState<number | ''>('');
    const [cantidad, setCantidad] = useState<number>(1);
    const [precio, setPrecio] = useState<number>(0);
    const [metodoPago, setMetodoPago] = useState<number>(0); // 0: Efectivo

    // Status states
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const API_URL = 'http://localhost:5035/api';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vehiculosRes, clientesRes, productosRes] = await Promise.all([
                    axios.get(`${API_URL}/vehiculos`),
                    axios.get(`${API_URL}/clientes`),
                    axios.get(`${API_URL}/productos`)
                ]);

                setVehiculos(vehiculosRes.data);
                setClientes(clientesRes.data);
                // Filter only eggs as requested "simulacion programada de ventas de huevo"
                setProductos(productosRes.data.filter((p: Producto) => p.esHuevo));
                setLoadingData(false);
            } catch (error) {
                console.error('Error loading data:', error);
                setMessage({ type: 'error', text: 'Error al cargar datos iniciales. Asegúrese de que el servidor esté corriendo.' });
                setLoadingData(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        if (!selectedVehiculo || !selectedCliente || !selectedProducto) {
            setMessage({ type: 'error', text: 'Por favor complete todos los campos requeridos.' });
            setSubmitting(false);
            return;
        }

        try {
            // Construct DateTime from date and time inputs
            const dateTime = new Date(`${fecha}T${hora}:00`);

            const payload = {
                clienteId: Number(selectedCliente),
                usuarioId: 1, // Hardcoded Admin for simulation
                vehiculoId: Number(selectedVehiculo),
                metodoPago: Number(metodoPago),
                fecha: dateTime.toISOString(),
                items: [
                    {
                        productoId: Number(selectedProducto),
                        cantidad: Number(cantidad),
                        precioUnitario: Number(precio)
                    }
                ]
            };

            await axios.post(`${API_URL}/ventas`, payload);

            setMessage({ type: 'success', text: 'Venta simulada registrada exitosamente.' });

            // Reset some fields for next entry
            // Keep Date, Vehicle, Client as they might be entering multiple for same day/route
            setCantidad(1);
            // setPrecio(0); // Keep price as it might be same
        } catch (error: any) {
            console.error('Error submitting sale:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Error al registrar la venta.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingData) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">Cargando datos...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft className="text-gray-600 dark:text-gray-300" size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Simulación de Ventas de Huevos</h1>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Fecha y Hora */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora</label>
                                <input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Vehículo y Cliente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehículo</label>
                                <div className="relative">
                                    <Truck className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <select
                                        value={selectedVehiculo}
                                        onChange={(e) => setSelectedVehiculo(Number(e.target.value))}
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        required
                                    >
                                        <option value="">Seleccionar Vehículo</option>
                                        {vehiculos.map(v => (
                                            <option key={v.vehiculoId} value={v.vehiculoId}>{v.marca} {v.modelo} ({v.patente})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <select
                                        value={selectedCliente}
                                        onChange={(e) => setSelectedCliente(Number(e.target.value))}
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        required
                                    >
                                        <option value="">Seleccionar Cliente</option>
                                        {clientes.map(c => (
                                            <option key={c.clienteId} value={c.clienteId}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Producto */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Producto (Huevo)</label>
                            <div className="relative">
                                <ShoppingCart className="absolute left-3 top-3 text-gray-400" size={20} />
                                <select
                                    value={selectedProducto}
                                    onChange={(e) => setSelectedProducto(Number(e.target.value))}
                                    className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                    required
                                >
                                    <option value="">Seleccionar Producto</option>
                                    {productos.map(p => (
                                        <option key={p.productoId} value={p.productoId}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Cantidad y Precio */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(Number(e.target.value))}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio Unitario ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={precio}
                                        onChange={(e) => setPrecio(Number(e.target.value))}
                                        className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Método de Pago */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMetodoPago(0)}
                                    className={`p-3 rounded-xl border transition-all ${metodoPago === 0 ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                                >
                                    Efectivo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMetodoPago(3)}
                                    className={`p-3 rounded-xl border transition-all ${metodoPago === 3 ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                                >
                                    Cta. Corriente
                                </button>
                            </div>
                        </div>

                        {/* Mensajes */}
                        {message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <p>{message.text}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {submitting ? 'Registrando...' : (
                                <>
                                    <Save size={20} />
                                    Registrar Venta Simulada
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
