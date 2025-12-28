'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Truck,
  PieChart,
  DollarSign,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronDown,
  AlertCircle,
  Package,
  Warehouse,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import NotificationBell from './NotificationBell';
import OperationalAlerts from './OperationalAlerts';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

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

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (pathname === '/login') return null;

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

  // Filter sections based on user role (for mobile)
  const mobileSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || (user && item.roles.includes(user.Rol)))
  })).filter(section => section.items.length > 0);


  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo only visible on mobile or if needed, but Sidebar acts as main brand on desktop */}
          <Link href="/" className="md:hidden flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image src="/logo.png" alt="SGA Logo" fill className="object-contain rounded-full" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">San Gabriel</span>
          </Link>

          {/* Breadcrumb or Title could go here for Desktop */}
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-slate-700 dark:text-white">
              {menuSections.flatMap(s => s.items).find(i => i.href === pathname)?.name || 'Panel de Control'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {user?.Rol !== 'Chofer' && (
            <>
              <OperationalAlerts />
              <NotificationBell />
            </>
          )}

          <div className="relative hidden sm:block">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700 dark:text-white">{user?.Nombre || 'Usuario'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.Rol}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-800">
                {user?.Nombre ? user.Nombre[0].toUpperCase() : 'U'}
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 py-1 z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Mi Cuenta</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Usuario ID: {user?.UsuarioId}
                    </p>
                  </div>

                  <div className="p-2">
                    <div className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                      <span className="font-medium">Tema</span>
                      <ThemeToggle />
                    </div>

                    {/* Admin Links */}
                    {user?.Rol === 'Admin' && (
                      <Link
                        href="/admin/restauracion"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <AlertCircle size={16} />
                        <span>Restauración</span>
                      </Link>
                    )}


                    <Link
                      href="/configuracion"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings size={16} />
                      <span>Configuración</span>
                    </Link>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-y-auto"
          >
            <div className="p-4 flex flex-col gap-4 shadow-inner">

              {mobileSections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">{section.title}</h3>
                  <div className="flex flex-col gap-1">
                    {section.items.map((link) => {
                      const active = isActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`px-4 py-3 rounded-xl text-base font-medium transition-colors flex items-center gap-3
                                      ${active
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                        >
                          <link.icon size={20} />
                          {link.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                    {user?.Nombre ? user.Nombre[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-white">{user?.Nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.Rol}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <ThemeToggle />
                  <Link
                    href="/configuracion"
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings size={20} />
                  </Link>
                  <button onClick={logout} className="p-2 text-red-400 hover:text-red-600">
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
