'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Truck,
    PieChart,
    DollarSign,
    Package,
    Star,
    ChevronRight,
    ChevronLeft,
    Menu,
    Settings,
    LogOut,
    Warehouse,
    ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    roles?: string[];
}

interface NavSection {
    title: string;
    items: NavItem[];
}

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(true);
    const [favorites, setFavorites] = useState<string[]>([]);

    // Prevent hydration mismatch
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const savedFavorites = localStorage.getItem('sidebarFavorites');
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    if (!mounted) return null;
    if (!user || pathname === '/login') return null;

    const toggleSidebar = () => setIsOpen(!isOpen);

    const toggleFavorite = (href: string) => {
        let newFavorites;
        if (favorites.includes(href)) {
            newFavorites = favorites.filter(f => f !== href);
        } else {
            newFavorites = [...favorites, href];
        }
        setFavorites(newFavorites);
        localStorage.setItem('sidebarFavorites', JSON.stringify(newFavorites));
    };

    const isActive = (path: string) => {
        if (path === '/' && pathname !== '/') return false;
        return pathname.startsWith(path);
    };

    const menuSections: NavSection[] = [
        {
            title: 'Principal',
            items: [
                { name: 'Panel de Control', href: '/', icon: LayoutDashboard },
            ]
        },
        {
            title: 'Gestión',
            items: [
                { name: 'Vehículos', href: '/vehiculos', icon: Truck, roles: ['Admin', 'Oficina'] },
                { name: 'Empleados', href: '/empleados', icon: Users, roles: ['Admin', 'Oficina'] },
                { name: 'Rendimiento Empleados', href: '/reportes/ventas-empleado', icon: ClipboardList, roles: ['Admin', 'Oficina'] },
                { name: 'Clientes', href: '/clientes', icon: Users, roles: ['Admin', 'Oficina'] },
            ]
        },
        {
            title: 'Operaciones',
            items: [
                { name: 'Pedidos', href: '/pedidos', icon: Truck, roles: ['Admin', 'Oficina'] },
                { name: 'Cierre Caja', href: '/admin/cierre-caja', icon: DollarSign, roles: ['Admin'] },
                { name: 'Gastos', href: '/gastos', icon: DollarSign, roles: ['Admin', 'Oficina'] },
            ]
        },
        {
            title: 'Inventario',
            items: [
                { name: 'Stock General', href: '/stock-general', icon: Warehouse, roles: ['Admin'] },
                { name: 'Mermas', href: '/mermas', icon: Package, roles: ['Admin', 'Oficina'] },
            ]
        },
        {
            title: 'Reportes',
            items: [
                { name: 'Estadísticas', href: '/estadisticas', icon: PieChart, roles: ['Admin', 'Oficina'] },
            ]
        }
    ];

    // Flatten items for favorites lookup
    const allItems = menuSections.flatMap(s => s.items);
    const favoriteItems = allItems.filter(item => favorites.includes(item.href));

    // Filter sections based on user role
    const startSections = menuSections.map(section => ({
        ...section,
        items: section.items.filter(item => !item.roles || (user && item.roles.includes(user.Rol)))
    })).filter(section => section.items.length > 0);

    return (
        <motion.aside
            animate={{ width: isOpen ? 280 : 80 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
            className="hidden md:flex flex-col h-screen bg-slate-900 border-r border-slate-800 sticky top-0 z-50 text-slate-300"
        >
            <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div className="relative w-8 h-8">
                                <Image src="/logo.png" alt="SGA" fill className="object-contain rounded-full" />
                            </div>
                            <div>
                                <h1 className="font-bold text-white leading-none">San Gabriel</h1>
                                <span className="text-[10px] uppercase text-blue-400 font-bold tracking-widest">Control</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                    {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-6 space-y-6">

                {/* FAVORITES SECTION */}
                {favorites.length > 0 && (
                    <div className="px-3">
                        {isOpen ? (
                            <h3 className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Favoritos</h3>
                        ) : (
                            <div className="h-4 mb-2 flex justify-center"><Star size={12} className="text-yellow-500" /></div>
                        )}

                        <div className="space-y-1">
                            {favoriteItems.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                     ${isActive(item.href)
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={22} className={isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-white'} />

                                    {isOpen && (
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="font-medium">{item.name}</span>
                                            <button
                                                onClick={(e) => { e.preventDefault(); toggleFavorite(item.href); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-yellow-400 transition-opacity"
                                            >
                                                <Star size={14} fill="currentColor" className="text-yellow-400" />
                                            </button>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* MAIN SECTIONS */}
                {startSections.map((section, idx) => (
                    <div key={idx} className="px-3">
                        {isOpen ? (
                            <h3 className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{section.title}</h3>
                        ) : (
                            <div className="h-px bg-slate-800 mx-2 my-2" />
                        )}

                        <div className="space-y-1">
                            {section.items.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                     ${isActive(item.href)
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={22} className={isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-white'} />

                                    {isOpen && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex-1 flex items-center justify-between"
                                        >
                                            <span className="font-medium">{item.name}</span>
                                            <button
                                                onClick={(e) => { e.preventDefault(); toggleFavorite(item.href); }}
                                                className={`p-1 transition-all ${favorites.includes(item.href) ? 'text-yellow-400 opacity-100' : 'opacity-0 group-hover:opacity-100 hover:text-slate-300'}`}
                                            >
                                                <Star size={14} fill={favorites.includes(item.href) ? "currentColor" : "none"} />
                                            </button>
                                        </motion.div>
                                    )}

                                    {!isOpen && (
                                        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                                            {item.name}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800">
                <button onClick={logout} className={`flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl transition-all w-full ${!isOpen && 'justify-center px-0'}`}>
                    <LogOut size={22} />
                    {isOpen && <span className="font-medium">Cerrar Sesión</span>}
                </button>
            </div>
        </motion.aside>
    );
}
