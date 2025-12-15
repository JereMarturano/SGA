'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { PackageX, ArrowLeft, Plus, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

interface Merma {
  fecha: string;
  usuario: string;
  vehiculo: string;
  producto: string;
  cantidad: number;
  motivo: string;
}

interface Producto {
  productoId: number;
  nombre: string;
  unidadesPorBulto: number;
  esHuevo: boolean;
}

export default function MermasPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Merma[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState('');
  const [esMaple, setEsMaple] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reportes/mermas-historial');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching mermas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Pre-fetch products
    api.get('/productos').then(res => setProductos(res.data)).catch(console.error);
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setError('');
    setCantidad('');
    setMotivo('');
    setSelectedProductId('');
    setEsMaple(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !cantidad || !motivo || !user) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');

      await api.post('/inventario/registrar-merma-general', {
        productoId: Number(selectedProductId),
        cantidad: Number(cantidad),
        esMaple: esMaple,
        usuarioId: user.UsuarioId,
        motivo: motivo
      });

      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al registrar la merma');
    } finally {
      setSubmitLoading(false);
    }
  };

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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
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

          {(user?.Rol === 'Admin' || user?.Rol === 'Encargado' || user?.Rol === 'Recolector') && (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30"
            >
              <Plus size={20} />
              Registrar Merma
            </button>
          )}
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
                        -{Math.abs(item.cantidad)}
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

      {/* Modal Registrar Merma */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Registrar Merma</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Producto
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                  required
                >
                  <option value="">Seleccionar Producto...</option>
                  {productos.map(p => (
                    <option key={p.productoId} value={p.productoId}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                    placeholder="Ej: 5"
                    required
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={esMaple}
                      onChange={(e) => setEsMaple(e.target.checked)}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="font-medium">Es Maple?</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Motivo
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
                  placeholder="Ej: Rotura en depósito, Vencimiento..."
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitLoading ? 'Registrando...' : 'Confirmar Merma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
