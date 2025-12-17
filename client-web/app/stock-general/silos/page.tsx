'use client';

import { useState, useEffect } from 'react';
import { Silo, ContenidoSilo } from '@/types/stock';
import { getSilos, getSiloContents, updateSiloContent } from '@/lib/api-stock';
import { Warehouse, Edit2, Plus, ArrowUp } from 'lucide-react';

export default function SilosPage() {
  const [silos, setSilos] = useState<Silo[]>([]);
  const [contents, setContents] = useState<Record<number, ContenidoSilo[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState<Partial<ContenidoSilo>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await getSilos();
      setSilos(s);

      const contentMap: Record<number, ContenidoSilo[]> = {};
      for (const silo of s) {
        contentMap[silo.id] = await getSiloContents(silo.id);
      }
      setContents(contentMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSiloContent(editingContent);
      setShowModal(false);
      loadData();
    } catch (error) {
      alert('Error updating silo content: ' + error);
    }
  };

  const openUpdate = (siloId: number, content?: ContenidoSilo) => {
    if (content) {
      setEditingContent(content);
    } else {
      setEditingContent({
        siloId,
        nombreMaterial: '',
        cantidad: 0,
        unidadMedida: 'Kg',
        costoPorUnidad: 0
      });
    }
    setShowModal(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Warehouse className="text-blue-600" /> Gestión de Silos (Alimentación)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {silos.map(silo => {
          const siloContents = contents[silo.id] || [];
          const totalWeight = siloContents.reduce((acc, curr) => acc + curr.cantidad, 0); // Assuming same units or normalized. Ideally should convert.
          const fillPercentage = Math.min((totalWeight / silo.capacidadMaxima) * 100, 100);

          return (
            <div key={silo.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{silo.nombre}</h2>
                <span className="text-sm text-gray-500">Capacidad: {silo.capacidadMaxima} Kg</span>
              </div>

              <div className="p-6">
                {/* Visual Representation */}
                <div className="mb-6 relative h-48 w-32 mx-auto bg-gray-200 rounded-lg border-2 border-gray-400 overflow-hidden">
                  <div
                    className="absolute bottom-0 w-full bg-yellow-400 transition-all duration-1000 ease-out"
                    style={{ height: `${fillPercentage}%` }}
                  >
                     <div className="w-full h-full bg-yellow-500 opacity-50 absolute top-0 left-0" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 bg-white bg-opacity-50 h-8 mt-20 rounded">
                    {fillPercentage.toFixed(1)}% Lleno
                  </div>
                </div>

                {/* Contents List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-semibold text-gray-700">Contenido Actual</h3>
                    <button
                      onClick={() => openUpdate(silo.id)}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-1"
                    >
                      <Plus size={14} /> Agregar Material
                    </button>
                  </div>

                  {siloContents.length > 0 ? (
                    <div className="space-y-3">
                       {siloContents.map(c => (
                         <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                           <div>
                             <p className="font-bold text-gray-800">{c.nombreMaterial}</p>
                             <p className="text-xs text-gray-500">Última act: {new Date(c.ultimaActualizacion).toLocaleDateString()}</p>
                           </div>
                           <div className="text-right">
                             <p className="font-bold text-lg">{c.cantidad} {c.unidadMedida}</p>
                             <p className="text-xs text-gray-500">${c.costoPorUnidad}/u</p>
                           </div>
                           <button
                              onClick={() => openUpdate(silo.id, c)}
                              className="ml-4 text-gray-400 hover:text-blue-600"
                           >
                             <Edit2 size={16} />
                           </button>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">Silo vacío.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingContent.id ? 'Actualizar Material' : 'Agregar Material'}</h2>
            <form onSubmit={handleUpdateContent}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Material</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editingContent.nombreMaterial || ''}
                  onChange={e => setEditingContent({...editingContent, nombreMaterial: e.target.value})}
                  required
                  placeholder="Maiz, Soja, Nucleo..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Cantidad</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={editingContent.cantidad || 0}
                      onChange={e => setEditingContent({...editingContent, cantidad: parseFloat(e.target.value)})}
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Unidad</label>
                    <select
                       className="w-full p-2 border rounded"
                       value={editingContent.unidadMedida || 'Kg'}
                       onChange={e => setEditingContent({...editingContent, unidadMedida: e.target.value})}
                    >
                      <option value="Kg">Kg</option>
                      <option value="Ton">Ton</option>
                    </select>
                 </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Costo por Unidad ($)</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={editingContent.costoPorUnidad || 0}
                  onChange={e => setEditingContent({...editingContent, costoPorUnidad: parseFloat(e.target.value)})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
