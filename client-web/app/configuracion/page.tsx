'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Settings, Moon, Sun, Bell, Shield, User, Building, Save } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

export default function ConfigurationPage() {
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
            <Settings size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Configuración
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Administra tus preferencias y ajustes del sistema
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Apariencia Section */}
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                <Sun size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Apariencia</h2>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-200">Tema del Sistema</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Alternar entre modo claro y oscuro
                </p>
              </div>
              <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded-lg transition-all ${
                    theme === 'light'
                      ? 'bg-white text-yellow-500 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Sun size={20} />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded-lg transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-600 text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Moon size={20} />
                </button>
              </div>
            </div>
          </section>

          {/* Notificaciones Section */}
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                <Bell size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Notificaciones</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">
                    Notificaciones Push
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Recibir alertas en el navegador
                  </p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors duration-300 flex items-center px-1 ${
                    notificationsEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">Alertas por Email</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Resumen diario de operaciones
                  </p>
                </div>
                <button
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`w-14 h-8 rounded-full transition-colors duration-300 flex items-center px-1 ${
                    emailAlerts ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </section>

          {/* Información de Empresa */}
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Building size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Datos de la Empresa
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  Nombre Fantasía
                </label>
                <input
                  type="text"
                  defaultValue="Avicola San Gabriel"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  CUIT / RUT
                </label>
                <input
                  type="text"
                  defaultValue="20-12345678-9"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  Dirección Operativa
                </label>
                <input
                  type="text"
                  defaultValue="Ruta 38 Km 45, Molinari, Córdoba"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/30">
                <Save size={18} />
                Guardar Cambios
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
