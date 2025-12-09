'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { PackageX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

interface Merma {
  fecha: string;
  usuario: string;
  vehiculo: string;
  producto: string;
  cantidad: number;
  motivo: string;
}

export default function MermasPage() {
  const [data, setData] = useState<Merma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/reportes/mermas-historial');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching mermas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Volver al Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
            <PackageX size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              Historial de Mermas
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Registro de roturas y pérdidas de mercadería.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Fecha
                  </th>
                  <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Usuario
                  </th>
                  <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Vehículo/Origen
                  </th>
                  <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Producto
                  </th>
                  <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Cantidad
                  </th>
                  <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-sm">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Cargando...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No hay registros de mermas.
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {new Date(item.fecha).toLocaleDateString()}{' '}
                        {new Date(item.fecha).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-slate-800 dark:text-white font-medium text-sm">
                        {item.usuario}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {item.vehiculo}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {item.producto}
                      </td>
                      <td className="px-6 py-4 text-red-600 dark:text-red-400 font-bold text-sm">
                        -{item.cantidad}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm italic">
                        {item.motivo}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
