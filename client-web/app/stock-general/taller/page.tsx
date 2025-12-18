'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

interface Vehiculo {
    vehiculoId: number;
    patente: string;
    marca: string;
    modelo: string;
    estado: string; // "Activo", "En Reparación" etc
}

export default function TallerPage() {
    const { user } = useAuth();
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

    useEffect(() => {
        fetchVehiculos();
    }, []);

    const fetchVehiculos = () => {
        api.get('/vehiculos').then(res => setVehiculos(res.data)).catch(console.error);
    };

    const toggleEstado = async (v: Vehiculo) => {
        const nuevoEstado = v.estado === 'En Reparación' ? 'Activo' : 'En Reparación';
        try {
            await api.post(`/stock-general/taller/vehiculo/${v.vehiculoId}/estado`, `"${nuevoEstado}"`, {
                headers: { 'Content-Type': 'application/json' }
            });
            fetchVehiculos();
        } catch (e) {
            alert('Error cambiando estado');
        }
    };

    const canEdit = user?.Rol === 'Admin' || user?.Rol === 'Chofer';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Taller - Estado de Vehículos</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehiculos.filter(v => v.patente !== 'GRANJA').map(v => (
                        <div key={v.vehiculoId} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{v.marca} {v.modelo}</h3>
                                    <p className="text-gray-500 text-sm">{v.patente}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.estado === 'En Reparación' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {v.estado}
                                </span>
                            </div>

                            {canEdit && (
                                <button
                                    onClick={() => toggleEstado(v)}
                                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${v.estado === 'En Reparación'
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                                        }`}
                                >
                                    {v.estado === 'En Reparación' ? 'Marcar Disponible' : 'Enviar a Taller'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
