'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
    Fuel,
    Wrench,
    Zap,
    Home,
    DollarSign,
    FileText,
    ShoppingBag,
    MoreHorizontal,
    Plus,
    Trash2,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Definición de tipos (alineado con el backend)
interface Gasto {
    gastoId?: number;
    fecha: string;
    monto: number;
    tipo: number;
    descripcion?: string;
    vehiculoId?: number;
    empleadoId?: number;
    kilometraje?: number;
    litrosCombustible?: number;
}

interface Vehiculo {
    vehiculoId: number;
    marca: string;
    modelo: string;
    patente: string;
}

interface Usuario {
    usuarioId: number;
    nombre: string;
}

// Enum de tipos de gasto (alineado con backend)
const TIPOS_GASTO = [
    { id: 0, label: 'Combustible', icon: Fuel, color: 'bg-orange-500' },
    { id: 1, label: 'Mantenimiento', icon: Wrench, color: 'bg-blue-500' },
    { id: 2, label: 'Peaje', icon: FileText, color: 'bg-gray-500' },
    { id: 3, label: 'Seguro', icon: FileText, color: 'bg-indigo-500' },
    { id: 4, label: 'Patente', icon: FileText, color: 'bg-slate-500' },
    { id: 5, label: 'Alquiler', icon: Home, color: 'bg-purple-500' },
    { id: 6, label: 'Servicios', icon: Zap, color: 'bg-yellow-500' },
    { id: 7, label: 'Sueldos', icon: DollarSign, color: 'bg-green-500' },
    { id: 8, label: 'Impuestos', icon: FileText, color: 'bg-red-500' },
    { id: 9, label: 'Marketing', icon: ShoppingBag, color: 'bg-pink-500' },
    { id: 10, label: 'Insumos', icon: ShoppingBag, color: 'bg-teal-500' },
    { id: 11, label: 'Varios', icon: MoreHorizontal, color: 'bg-slate-400' },
];

export default function GastosPage() {
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [empleados, setEmpleados] = useState<Usuario[]>([]);
    const [selectedVehiculoId, setSelectedVehiculoId] = useState<number | null>(null);
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | null>(null);

    // Cargar gastos recientes
    const loadGastos = async () => {
        try {
            // Nota: En una implementación real, usaríamos un endpoint paginado o filtrado
            // Por ahora, asumimos que existe un endpoint general o usamos el de vehículos adaptado
            // Como el controller actual es GastosVehiculosController, necesitamos adaptarlo o crear uno nuevo.
            // Por simplicidad en este paso, usaremos el endpoint existente asumiendo que el backend lo soporta
            // Ojo: El endpoint actual requiere vehiculoId para listar. 
            // TODO: Necesitamos un endpoint general de gastos en el backend.
            // Por ahora simularemos la lista vacía o implementaremos el fetch cuando el backend tenga el endpoint general.
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGastos();

        // Cargar vehículos
        const fetchVehiculos = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/vehiculos`);
                if (res.ok) {
                    const data = await res.json();
                    setVehiculos(data);
                }
            } catch (error) {
                console.error("Error cargando vehículos:", error);
            }
        };

        // Cargar empleados
        const fetchEmpleados = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/inventario/usuarios`);
                if (res.ok) {
                    const data = await res.json();
                    setEmpleados(data);
                }
            } catch (error) {
                console.error("Error cargando empleados:", error);
            }
        };

        fetchVehiculos();
        fetchEmpleados();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedType === null || !amount) return;

        setIsSubmitting(true);
        try {
            const nuevoGasto: Gasto = {
                fecha: new Date().toISOString(),
                monto: parseFloat(amount),
                tipo: selectedType,
                descripcion: description || TIPOS_GASTO.find(t => t.id === selectedType)?.label,
                vehiculoId: selectedVehiculoId || undefined,
                empleadoId: selectedEmpleadoId || undefined
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/gastosvehiculos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoGasto),
            });

            if (!res.ok) throw new Error('Error al guardar');

            // Reset form
            setAmount('');
            setDescription('');
            setSelectedType(null);
            setSelectedVehiculoId(null);
            setSelectedEmpleadoId(null);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            loadGastos();
        } catch (error) {
            console.error(error);
            alert('Error al guardar el gasto');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTypeSelect = (id: number) => {
        setSelectedType(id);
        // Focus on amount input automatically could be nice
    };

    const selectedTypeInfo = selectedType !== null ? TIPOS_GASTO.find(t => t.id === selectedType) : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-20">
            <Header />

            <main className="max-w-md mx-auto px-4 py-6">
                {/* Header Section */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                        Hola, Santiago 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        ¿Qué gastos tuvimos hoy?
                    </p>
                </div>

                {/* Quick Add Grid */}
                {!selectedTypeInfo ? (
                    <div className="grid grid-cols-3 gap-4 mb-10">
                        {TIPOS_GASTO.map((tipo) => (
                            <button
                                key={tipo.id}
                                onClick={() => handleTypeSelect(tipo.id)}
                                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-transform active:scale-95"
                            >
                                <div className={`p-3 rounded-xl ${tipo.color} text-white mb-2 shadow-lg shadow-${tipo.color}/30`}>
                                    <tipo.icon size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">
                                    {tipo.label}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    /* Input Form Overlay */
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 mb-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${selectedTypeInfo.color} text-white`}>
                                    <selectedTypeInfo.icon size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {selectedTypeInfo.label}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedType(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                Cancelar
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Monto
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        autoFocus
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 pl-10 pr-4 text-3xl font-black text-slate-800 dark:text-white outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Selector de Vehículo (Solo para tipos relacionados con vehículos) */}
                            {[0, 1, 2, 3, 4].includes(selectedType || -1) && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                        Vehículo
                                    </label>
                                    <select
                                        value={selectedVehiculoId || ''}
                                        onChange={(e) => setSelectedVehiculoId(Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Seleccionar Vehículo...</option>
                                        {vehiculos.map((v) => (
                                            <option key={v.vehiculoId} value={v.vehiculoId}>
                                                {v.marca} {v.modelo} ({v.patente})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Selector de Empleado (Solo para Sueldos - ID 7) */}
                            {selectedType === 7 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                        Empleado
                                    </label>
                                    <select
                                        value={selectedEmpleadoId || ''}
                                        onChange={(e) => setSelectedEmpleadoId(Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Seleccionar Empleado...</option>
                                        {empleados.map((e) => (
                                            <option key={e.usuarioId} value={e.usuarioId}>
                                                {e.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Descripción (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detalles adicionales..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !amount || ([0, 1, 2, 3, 4].includes(selectedType || -1) && !selectedVehiculoId)}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Success Message */}
                {showSuccess && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 z-50">
                        <div className="bg-white/20 p-1 rounded-full">
                            <Plus size={16} />
                        </div>
                        ¡Gasto guardado!
                    </div>
                )}

                {/* Recent History (Placeholder) */}
                <div className="mt-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Recientes</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-center text-slate-400 text-sm">
                        Los gastos recientes aparecerán aquí.
                    </div>
                </div>
            </main>
        </div>
    );
}
