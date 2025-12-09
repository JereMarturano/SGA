'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Package, DollarSign, AlertCircle, UserX, Info } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';

interface Alerta {
    id: number;
    titulo: string;
    mensaje: string;
    tipo: string;
    fecha: string;
    icono: string;
    url?: string;
}

export default function OperationalAlerts() {
    const [alerts, setAlerts] = useState<Alerta[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchAlerts = async () => {
        try {
            const response = await api.get<Alerta[]>('/alertas');
            setAlerts(response.data);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Package': return <Package size={20} />;
            case 'DollarSign': return <DollarSign size={20} />;
            case 'AlertCircle': return <AlertCircle size={20} />;
            case 'UserX': return <UserX size={20} />;
            default: return <Info size={20} />;
        }
    };

    const getBgColor = (tipo: string) => {
        switch (tipo) {
            case 'Warning': return 'bg-amber-50 dark:bg-amber-900/20';
            case 'Critical': return 'bg-red-50 dark:bg-red-900/20';
            default: return 'bg-blue-50 dark:bg-blue-900/20';
        }
    };

    const getBorderColor = (tipo: string) => {
        switch (tipo) {
            case 'Warning': return 'border-amber-200 dark:border-amber-800';
            case 'Critical': return 'border-red-200 dark:border-red-800';
            default: return 'border-blue-200 dark:border-blue-800';
        }
    };

    const getIconColor = (tipo: string) => {
        switch (tipo) {
            case 'Warning': return 'text-amber-600 dark:text-amber-400';
            case 'Critical': return 'text-red-600 dark:text-red-400';
            default: return 'text-blue-600 dark:text-blue-400';
        }
    };

    const warningCount = alerts.filter(a => a.tipo === 'Warning' || a.tipo === 'Critical').length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative transition-colors"
                title="Alertas Operativas"
            >
                <AlertTriangle size={24} className={warningCount > 0 ? "text-amber-500 animate-pulse" : "text-gray-600 dark:text-gray-300"} />
                {alerts.length > 0 && (
                    <span className={`absolute top-1 right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-gray-800 ${warningCount > 0 ? 'bg-amber-500' : 'bg-blue-500'}`}>
                        {alerts.length > 9 ? '9+' : alerts.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-500" />
                            Alertas Operativas
                        </h3>
                        <span className="text-xs text-gray-500">{alerts.length} activas</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <AlertTriangle size={32} className="mx-auto mb-2 opacity-20" />
                                <p>Todo operativo. No hay alertas.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {alerts.map((alert) => (
                                    <Link
                                        href={alert.url || '#'}
                                        key={alert.id}
                                        onClick={() => setIsOpen(false)}
                                        className={`block p-4 hover:opacity-80 transition-opacity ${getBgColor(alert.tipo)}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 ${getIconColor(alert.tipo)}`}>
                                                {getIcon(alert.icono)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-semibold ${getIconColor(alert.tipo)}`}>
                                                    {alert.titulo}
                                                </h4>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                    {alert.mensaje}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(alert.fecha).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
