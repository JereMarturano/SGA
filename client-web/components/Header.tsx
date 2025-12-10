'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Truck,
  PieChart,
  Menu,
  User,
  X,
  LogOut,
  Settings,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import NotificationBell from './NotificationBell';
import OperationalAlerts from './OperationalAlerts';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

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

  const allNavLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vehículos', href: '/vehiculos', icon: Truck, roles: ['Admin', 'Oficina'] },
    { name: 'Empleados', href: '/empleados', icon: Users, roles: ['Admin', 'Oficina'] },
    { name: 'Clientes', href: '/clientes', icon: User, roles: ['Admin', 'Oficina'] },
    { name: 'Estadísticas', href: '/estadisticas', icon: PieChart, roles: ['Admin', 'Oficina'] },
  ];

  const navLinks = allNavLinks.filter(link => !link.roles || (user && link.roles.includes(user.Rol)));

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image src="/logo.png" alt="SGA Logo" fill className="object-contain rounded-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none tracking-tight">
                Avicola San Gabriel
              </h1>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">
                Torre de Control
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                                ${active
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                >
                  <link.icon size={18} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
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
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.Rol || 'Invitado'}</p>
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

          <button
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
            className="md:hidden overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
          >
            <div className="p-4 flex flex-col gap-2 shadow-inner">
              {navLinks.map((link) => {
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

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                    S
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-white">Santiago</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Administrador</p>
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
                  <button className="p-2 text-red-400 hover:text-red-600">
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
