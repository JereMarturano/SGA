'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, CheckCircle, AlertTriangle, Plus, X } from 'lucide-react';
import api from '../../lib/axios';
import { useRouter } from 'next/navigation';

interface Viaje {
    ViajeId: number;
    VehiculoId: number;
    Vehiculo: { Patente: string; Modelo: string };
    ChoferId: number;
    Chofer: { Nombre: string };
    FechaSalida: string;
    Estado: number; // 0: EnCurso
    Observaciones: string;
}

interface Vehiculo {
    VehiculoId: number;
    Patente: string;
    Marca: string;
    Modelo: string;
    EnRuta: boolean;
}

interface Empleado {
    UsuarioId: number;
    Nombre: string;
    Role: string; // "Chofer"
    Estado: boolean;
}

export default function ViajesPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [activeTrips, setActiveTrips] = useState<Viaje[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [choferes, setChoferes] = useState<Empleado[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehiculo, setSelectedVehiculo] = useState<number | ''>('');
    const [selectedChofer, setSelectedChofer] = useState<number | ''>('');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchData();
    }, [isAuthenticated, user, router]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [viajesRes, vehiculosRes, empleadosRes] = await Promise.all([
                api.get('/viajes/activos'),
                api.get('/vehiculos'),
                api.get('/empleados')
            ]);

            setActiveTrips(viajesRes.data);
            setVehiculos(vehiculosRes.data.filter((v: Vehiculo) => !v.EnRuta)); // Only show available vehicles
            setChoferes(empleadosRes.data.filter((e: Empleado) => e.Role === 'Chofer' && e.Estado));
        } catch (err) {
            console.error(err);
            setError('Error al cargar datos.');
        } finally {
            setLoading(false);
        }
    };

    const [closingTrip, setClosingTrip] = useState<Viaje | null>(null);
    const [reconciliationStock, setReconciliationStock] = useState<any[]>([]);

    // When closingTrip changes, fetch stock
    useEffect(() => {
        if (!closingTrip) return;

        const fetchStock = async () => {
            try {
                const res = await api.get(`/inventario/stock-vehiculo/${closingTrip.VehiculoId}`);
                // Initialize real quantity with theoretical quantity
                const initializedStock = res.data.map((item: any) => ({
                    ...item,
                    cantidadReal: item.cantidad // Default to theoretical
                }));
                setReconciliationStock(initializedStock);
            } catch (err) {
                console.error("Error fetching vehicle stock:", err);
                alert("Error al cargar stock del vehículo para control.");
            }
        };
        fetchStock();
    }, [closingTrip]);

    const handleStartTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/viajes/iniciar', {
                VehiculoId: Number(selectedVehiculo),
                ChoferId: Number(selectedChofer),
                Observaciones: observaciones
            });
            setIsModalOpen(false);
            setObservaciones('');
            setSelectedVehiculo('');
            setSelectedChofer('');
            fetchData(); // Refresh list
        } catch (err: any) {
            alert(err.response?.data || 'Error al iniciar viaje');
        }
    };

    const handleInitiateCloseIndex = (trip: Viaje) => {
        setClosingTrip(trip);
    };

    const handleConfirmClose = async () => {
        if (!closingTrip) return;

        // Build Adjustments List
        const ajustes = reconciliationStock.map(item => ({
            ProductoId: item.productoId,
            CantidadTeorica: item.cantidad, // Original DB Value
            // Convert back to DB Unit if it was Huevos/Units
            CantidadReal: item.isHuevosUnit ? (Number(item.cantidadReal) * 30) : Number(item.cantidadReal)
        }));

        try {
            await api.post(`/viajes/finalizar/${closingTrip.ViajeId}`, {
                Observaciones: 'Finalizado con control de stock',
                Ajustes: ajustes
            });
            setClosingTrip(null);
            setReconciliationStock([]);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data || 'Error al finalizar viaje');
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Control de Salidas</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">Gestiona o autoriza los viajes de los choferes.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-colors"
                    >
                        <Plus size={20} />
                        Nuevo Viaje
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}

                {/* Active Trips Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTrips.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No hay viajes activos en este momento.
                        </div>
                    ) : (
                        activeTrips.map((trip) => (
                            <motion.div
                                key={trip.ViajeId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                                <Truck size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white">{trip.Chofer?.Nombre}</h3>
                                                <p className="text-sm text-slate-500">{trip.Vehiculo?.Modelo} ({trip.Vehiculo?.Patente})</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800">
                                            En Curso
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-slate-400" />
                                            <span>Salida: {new Date(trip.FechaSalida).toLocaleString()}</span>
                                        </div>
                                        {trip.Observaciones && (
                                            <p className="italic text-slate-500">"{trip.Observaciones}"</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleInitiateCloseIndex(trip)}
                                    className="w-full mt-2 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                                >
                                    Finalizar Viaje
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Modal Nuevo Viaje */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
                            >
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Autorizar Nuevo Viaje</h3>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleStartTrip} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Vehículo Disponible
                                        </label>
                                        <select
                                            value={selectedVehiculo}
                                            onChange={(e) => setSelectedVehiculo(Number(e.target.value))}
                                            required
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Seleccionar vehículo...</option>
                                            {vehiculos.map(v => (
                                                <option key={v.VehiculoId} value={v.VehiculoId}>
                                                    {v.Marca} {v.Modelo} - {v.Patente}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Chofer
                                        </label>
                                        <select
                                            value={selectedChofer}
                                            onChange={(e) => setSelectedChofer(Number(e.target.value))}
                                            required
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Seleccionar chofer...</option>
                                            {choferes.map(c => (
                                                <option key={c.UsuarioId} value={c.UsuarioId}>
                                                    {c.Nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Observaciones
                                        </label>
                                        <textarea
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder="Ej: Ruta zona norte..."
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20"
                                        >
                                            Autorizar
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal Cierre de Viaje (Control Stock) */}
                <AnimatePresence>
                    {closingTrip && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Control de Cierre de Viaje</h3>
                                        <p className="text-sm text-slate-500">Verificá el stock remanente en el vehículo</p>
                                    </div>
                                    <button
                                        onClick={() => setClosingTrip(null)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1">
                                    {reconciliationStock.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            Cargando stock teórico...
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-4 rounded-xl text-sm flex gap-3">
                                                <AlertTriangle size={20} className="shrink-0" />
                                                <p>
                                                    Por favor, confirmá las cantidades reales que quedan en el vehículo. Si hay diferencia con el teórico, se registrará como ajuste/merma.
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                                                        <tr>
                                                            <th className="px-4 py-3">Producto</th>
                                                            <th className="px-4 py-3 text-center">Teórico</th>
                                                            <th className="px-4 py-3 text-center bg-blue-50 dark:bg-blue-900/10">Real (Confirmar)</th>
                                                            <th className="px-4 py-3 text-center">Diferencia</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                        {reconciliationStock.map((item, index) => {
                                                            const diff = (Number(item.cantidadReal) || 0) - (item.isHuevosUnit ? item.cantidad / 30 : item.cantidad);
                                                            return (
                                                                <tr key={item.productoId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                                                                        {item.producto?.nombre}
                                                                        <span className="text-xs font-normal text-slate-400 block">
                                                                            {item.producto?.unidadDeMedida}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center text-slate-500">
                                                                        {item.cantidad}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center bg-blue-50 dark:bg-blue-900/10">
                                                                        <input
                                                                            type="number"
                                                                            value={item.cantidadReal}
                                                                            onChange={(e) => {
                                                                                const newVal = parseFloat(e.target.value);
                                                                                const newStock = [...reconciliationStock];
                                                                                newStock[index].cantidadReal = isNaN(newVal) ? 0 : newVal;
                                                                                setReconciliationStock(newStock);
                                                                            }}
                                                                            className="w-20 px-2 py-1 text-center font-bold text-blue-600 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                                            step="0.5"
                                                                        />
                                                                    </td>
                                                                    <td className={`px-4 py-3 text-center font-bold ${diff < 0 ? 'text-red-500' : diff > 0 ? 'text-green-500' : 'text-slate-400'
                                                                        }`}>
                                                                        {diff > 0 ? `+${diff}` : diff}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 pt-0 flex gap-3">
                                    <button
                                        onClick={() => setClosingTrip(null)}
                                        className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmClose}
                                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <CheckCircle size={20} />
                                        Confirmar y Cerrar
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

