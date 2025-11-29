'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import api from '@/lib/axios';

interface Notificacion {
    notificacionId: number;
    mensaje: string;
    fechaCreacion: string;
    leido: boolean;
    tipo: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notificacion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const response = await api.get<Notificacion[]>('/notificaciones');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.leido).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
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

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/notificaciones/${id}/leer`);
            setNotifications(prev => prev.filter(n => n.notificacionId !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative transition-colors"
            >
                <Bell size={24} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-gray-800">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                        <span className="text-xs text-gray-500">{unreadCount} nuevas</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                <p>No tienes notificaciones nuevas</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {notifications.map((notif) => (
                                    <div key={notif.notificacionId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex gap-3 group">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800 dark:text-gray-200">{notif.mensaje}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.fechaCreacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => markAsRead(notif.notificacionId)}
                                            className="text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            title="Marcar como leída"
                                        >
                                            <Check size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
