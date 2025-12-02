'use client';

import { useState } from 'react';
import { LayoutDashboard, Users, Truck, PieChart, Menu, User, X, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vehículos', href: '/vehiculos', icon: Truck },
    { name: 'Empleados', href: '/empleados', icon: Users },
    { name: 'Clientes', href: '/clientes', icon: User },
    { name: 'Estadísticas', href: '/estadisticas', icon: PieChart },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
                  <LayoutDashboard className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none tracking-tight">SGA</h1>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">Torre de Control</span>
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
          <NotificationBell />

          <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700 dark:text-white">Santiago</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-800">
              S
            </div>
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
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <Settings size={20} />
                        </button>
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
