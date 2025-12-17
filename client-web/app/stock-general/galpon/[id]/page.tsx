'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LoteAve, EventoMortalidad } from '@/types/stock';
import { getActiveLote, getLoteHistory, createLote, updateLote, registerMortalidad } from '@/lib/api-stock';
import { AlertCircle, Plus, History, Activity } from 'lucide-react';

export default function GalponPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Number(params.id);
  const isPollito = searchParams.get('type') === 'pollito';

  const [activeLote, setActiveLote] = useState<LoteAve | null>(null);
  const [history, setHistory] = useState<LoteAve[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [showMortalityModal, setShowMortalityModal] = useState(false);

  // Forms
  const [newLote, setNewLote] = useState({
    cantidadInicial: 0,
    precioCompra: 0,
  });
  const [mortality, setMortality] = useState({
    cantidad: 1,
    motivo: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const active = await getActiveLote(id);
      setActiveLote(active);
      const hist = await getLoteHistory(id);
      setHistory(hist);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLote({
        ubicacionId: id,
        tipoAve: isPollito ? 1 : 0,
        cantidadInicial: newLote.cantidadInicial,
        precioCompra: newLote.precioCompra,
      });
      setShowNewBatchModal(false);
      loadData();
    } catch (error) {
      alert('Error creating batch: ' + error);
    }
  };

  const handleRegisterMortality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLote) return;
    try {
      await registerMortalidad({
        loteId: activeLote.id,
        fecha: new Date().toISOString(),
        cantidad: mortality.cantidad,
        motivo: mortality.motivo,
      });
      setShowMortalityModal(false);
      loadData();
    } catch (error) {
      alert('Error registering mortality: ' + error);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isPollito ? 'Habitación Pollitos' : `Galpón ${id}`}</h1>
        <button
          onClick={() => setShowNewBatchModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
        >
          <Plus size={18} /> Nuevo Lote
        </button>
      </div>

      {/* Active Batch Card */}
      {activeLote ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Activity className="text-blue-500" /> Lote Activo
              </h2>
              <p className="text-gray-600">Fecha Alta: {new Date(activeLote.fechaAlta).toLocaleDateString()}</p>
              <p className="text-gray-600">Cantidad Inicial: {activeLote.cantidadInicial}</p>
              <p className="text-3xl font-bold mt-2 text-blue-800">{activeLote.cantidadActual} <span className="text-sm font-normal text-gray-500">aves actuales</span></p>
            </div>
            <button
              onClick={() => setShowMortalityModal(true)}
              className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 border border-red-300"
            >
              Registrar Mortalidad/Baja
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300 mb-8 text-center text-gray-500">
          No hay lote activo en este momento.
        </div>
      )}

      {/* History */}
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <History /> Historial de Lotes
      </h3>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Alta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Baja</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final/Actual</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((h) => (
              <tr key={h.id}>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(h.fechaAlta).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{h.fechaBaja ? new Date(h.fechaBaja).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{h.cantidadInicial}</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">{h.cantidadActual}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${h.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {h.activo ? 'Activo' : 'Finalizado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showNewBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Iniciar Nuevo Lote</h2>
            <form onSubmit={handleCreateLote}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Cantidad de Aves</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={newLote.cantidadInicial}
                  onChange={e => setNewLote({...newLote, cantidadInicial: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Precio de Compra (Total o Unitario)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={newLote.precioCompra}
                  onChange={e => setNewLote({...newLote, precioCompra: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewBatchModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Crear Lote</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMortalityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Registrar Baja</h2>
            <form onSubmit={handleRegisterMortality}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Cantidad</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={mortality.cantidad}
                  onChange={e => setMortality({...mortality, cantidad: parseInt(e.target.value)})}
                  required
                  min="1"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Motivo (Opcional)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={mortality.motivo}
                  onChange={e => setMortality({...mortality, motivo: e.target.value})}
                  placeholder="Ej. Enfermedad, Natural..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowMortalityModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
