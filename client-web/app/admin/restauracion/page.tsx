'use client';

import { useState } from 'react';
import Header from '../../../components/Header';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import { AlertCircle, RotateCcw, Search, Calendar, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RestorationPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [usuarioId, setUsuarioId] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [motivo, setMotivo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    if (user && user.Rol !== 'Admin') {
        router.push('/');
        return null;
    }

    const handleRestaurar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('¿ESTÁ SEGURO? Esta acción revertirá todas las ventas y acciones de este usuario desde la fecha indicada. ES IRREVERSIBLE.')) return;

        setIsLoading(true);
        setSuccessMessage('');
        setError('');

        try {
            await api.post(`/admin/safety/revertir-usuario/${usuarioId}`, {
                Desde: fechaInicio ? new Date(fechaInicio).toISOString() : null,
                Motivo: motivo
            });
            setSuccessMessage('Acciones revertidas exitosamente. El stock ha sido restaurado y las ventas canceladas.');
            setUsuarioId('');
            setMotivo('');
            setFechaInicio('');
        } catch (err: any) {
            setError(err.response?.data || 'Error al revertir acciones.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <AlertCircle className="text-red-600" size={32} />
                        Panel de Restauración de Emergencia
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Utilice esta herramienta SOLO en casos de cuentas comprometidas o errores masivos.
                        Permite revertir las acciones de un usuario específico.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-red-200 dark:border-red-900/50 overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-900/10 p-6 border-b border-red-100 dark:border-red-900/30">
                        <h2 className="text-lg font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                            <UserX size={20} />
                            Revertir Acciones de Usuario
                        </h2>
                    </div>

                    <form onSubmit={handleRestaurar} className="p-6 space-y-6">
                        {successMessage && (
                            <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center gap-2">
                                <RotateCcw size={20} />
                                {successMessage}
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 flex items-center gap-2">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    ID del Usuario Malicioso
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        value={usuarioId}
                                        onChange={(e) => setUsuarioId(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                                        placeholder="Ej: 15"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Desde (Fecha/Hora) - Opcional
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="datetime-local"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Si se deja vacío, se revertirán TODAS las acciones activas.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Motivo de la Restauración
                            </label>
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                required
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                placeholder="Describa por qué se están revirtiendo estas acciones..."
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span>Procesando...</span>
                                ) : (
                                    <>
                                        <RotateCcw size={20} />
                                        EJECUTAR RESTAURACIÓN
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
