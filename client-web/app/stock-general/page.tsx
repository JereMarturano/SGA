'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
    Home,
    Database,
    Factory,
    Package,
    Wrench,
    Egg,
    TrendingUp
} from 'lucide-react';

export default function StockGeneralPage() {
    const router = useRouter();

    const sections = [
        {
            title: 'Galpones',
            description: 'Gestión de galpones, cantidad de aves y registro de mortalidad.',
            icon: <Home className="h-8 w-8 text-blue-500" />,
            href: '/stock-general/galpones',
            color: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            title: 'Silos',
            description: 'Control de stock de alimentos, recargas y consumo.',
            icon: <Database className="h-8 w-8 text-yellow-500" />,
            href: '/stock-general/silos',
            color: 'bg-yellow-50 dark:bg-yellow-900/20'
        },
        {
            title: 'Fábrica',
            description: 'Producción de alimento balanceado y ventas directas.',
            icon: <Factory className="h-8 w-8 text-orange-500" />,
            href: '/stock-general/fabrica',
            color: 'bg-orange-50 dark:bg-orange-900/20'
        },
        {
            title: 'Depósito',
            description: 'Inventario general de insumos, maples y otros.',
            icon: <Package className="h-8 w-8 text-purple-500" />,
            href: '/stock-general/deposito',
            color: 'bg-purple-50 dark:bg-purple-900/20'
        },
        {
            title: 'Habitación de Pollitos',
            description: 'Gestión de crianza y recepción de pollitos.',
            icon: <Egg className="h-8 w-8 text-pink-500" />,
            href: '/stock-general/pollitos',
            color: 'bg-pink-50 dark:bg-pink-900/20'
        },
        {
            title: 'Taller',
            description: 'Estado de vehículos y registro de mantenimiento.',
            icon: <Wrench className="h-8 w-8 text-gray-500" />,
            href: '/stock-general/taller',
            color: 'bg-gray-50 dark:bg-gray-900/20'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Administración de Stock General
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((section) => (
                        <div
                            key={section.title}
                            onClick={() => router.push(section.href)}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden border border-gray-100 dark:border-gray-700"
                        >
                            <div className={`p-6 ${section.color}`}>
                                <div className="flex items-center justify-between mb-4">
                                    {section.icon}
                                    <TrendingUp className="h-5 w-5 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {section.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    {section.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
