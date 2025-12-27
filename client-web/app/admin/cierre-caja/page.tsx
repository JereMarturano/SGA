'use client';

import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Truck, Egg, Save, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import api from '@/lib/axios';
import { CierreCajaDiario } from '@/types/cierre-caja';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CierreCajaPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [resumen, setResumen] = useState<CierreCajaDiario | null>(null);
    const [historial, setHistorial] = useState<CierreCajaDiario[]>([]);
    const [loading, setLoading] = useState(false);
    const [closing, setClosing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [yaCerrado, setYaCerrado] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.Rol === 'Chofer') {
            // Redirect or show unauthorized? Assuming Admin only.
            // router.push('/');
        }
    }, [user, authLoading]);

    useEffect(() => {
        fetchResumen();
        fetchHistorial();
    }, [fecha]);

    const fetchResumen = async () => {
        setLoading(true);
        setError('');
        setYaCerrado(false);
        try {
            // Check if already closed
            const existeRes = await api.get(`/cierrecaja/existe?fecha=${fecha}`);
            if (existeRes.data) {
                setYaCerrado(true);
            }

            const res = await api.get(`/cierrecaja/resumen?fecha=${fecha}`);
            setResumen(res.data);
        } catch (err) {
            console.error(err);
            setError('Error al obtener el resumen.');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistorial = async () => {
        try {
            const res = await api.get('/cierrecaja/historial');
            setHistorial(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCerrarCaja = async () => {
        if (!resumen) return;
        if (!confirm('¿Está seguro de cerrar la caja para esta fecha? Esto registrará los totales actuales.')) return;

        setClosing(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/cierrecaja', resumen);
            setSuccess('Caja cerrada correctamente.');
            setYaCerrado(true);
            fetchHistorial();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data || 'Error al cerrar la caja.');
        } finally {
            setClosing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white">Cierre de Caja Diario</h1>
                        <p className="text-slate-500 dark:text-slate-400">Resumen de ventas y gastos por día</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <Calendar className="text-blue-500" />
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="bg-transparent text-slate-800 dark:text-white font-bold outline-none"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-xl flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-4 bg-green-100 text-green-700 rounded-xl flex items-center gap-2">
                        <AlertCircle size={20} />
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10">Cargando resumen...</div>
                ) : resumen ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Ventas */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                                        <DollarSign size={24} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-500 uppercase">Total Ventas</span>
                                </div>
                                <p className="text-3xl font-black text-slate-800 dark:text-white">
                                    ${resumen.totalVentas.toLocaleString()}
                                </p>
                            </div>

                            {/* Total Gastos */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                                        <Truck size={24} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-500 uppercase">Total Gastos</span>
                                </div>
                                <p className="text-3xl font-black text-slate-800 dark:text-white">
                                    ${resumen.totalGastos.toLocaleString()}
                                </p>
                            </div>

                            {/* Huevos Vendidos */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400">
                                        <Egg size={24} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-500 uppercase">Huevos Vendidos</span>
                                </div>
                                <p className="text-3xl font-black text-slate-800 dark:text-white">
                                    {resumen.totalHuevosVendidos.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Unidades/Bultos según carga</p>
                            </div>

                            {/* Saldo Neto */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                        <DollarSign size={24} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-500 uppercase">Saldo Neto</span>
                                </div>
                                <p className={`text-3xl font-black ${resumen.saldoNeto >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>
                                    ${resumen.saldoNeto.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            {yaCerrado ? (
                                <button disabled className="bg-slate-300 text-slate-500 px-6 py-3 rounded-xl font-bold cursor-not-allowed">
                                    Caja Cerrada
                                </button>
                            ) : (
                                <button
                                    onClick={handleCerrarCaja}
                                    disabled={closing}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all"
                                >
                                    {closing ? 'Cerrando...' : (
                                        <>
                                            <Save size={20} />
                                            Cerrar Caja del Día
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </>
                ) : null}

                {/* Historial */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Historial de Cierres</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="p-4 font-bold">Fecha</th>
                                    <th className="p-4 font-bold">Responsable</th>
                                    <th className="p-4 font-bold text-right">Ventas</th>
                                    <th className="p-4 font-bold text-right">Gastos</th>
                                    <th className="p-4 font-bold text-right">Huevos</th>
                                    <th className="p-4 font-bold text-right">Saldo</th>
                                    <th className="p-4 font-bold">Cerrado El</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {historial.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">No hay cierres registrados.</td>
                                    </tr>
                                ) : (
                                    historial.map((cierre) => (
                                        <tr key={cierre.cierreId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                            <td className="p-4 font-medium text-slate-800 dark:text-white">
                                                {new Date(cierre.fecha).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-300">
                                                {cierre.usuario?.nombre} {cierre.usuario?.apellido}
                                            </td>
                                            <td className="p-4 text-right text-green-600 font-medium">
                                                ${cierre.totalVentas.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right text-red-500 font-medium">
                                                ${cierre.totalGastos.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right text-slate-600 dark:text-slate-300">
                                                {cierre.totalHuevosVendidos.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right font-black text-blue-600 dark:text-blue-400">
                                                ${cierre.saldoNeto.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-slate-400 text-sm">
                                                {cierre.fechaCierre ? new Date(cierre.fechaCierre).toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
}
