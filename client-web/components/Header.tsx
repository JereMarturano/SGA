'use client';

import { LayoutDashboard, Users, Truck, PieChart, Menu, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import NotificationBell from './NotificationBell';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

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
            <Link href="/" className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <Image src="/logo.png" alt="SGA Logo" fill className="object-contain rounded-full" />
                </div>
                <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none tracking-tight">SGA</h1>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">Torre de Control</span>
                </div>
            </Link>

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

        <div className="flex items-center gap-6">
          <NotificationBell />

          <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 dark:text-white">Santiago</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-800">
              S
            </div>
          </div>

          <button className="md:hidden p-2 text-slate-600 dark:text-slate-300">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
