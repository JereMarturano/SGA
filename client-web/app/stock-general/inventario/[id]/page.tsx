'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ItemInventario } from '@/types/stock';
import { getInventario, saveItem, deleteItem } from '@/lib/api-stock';
import { Plus, Trash2, Edit2, Package, Search } from 'lucide-react';

export default function InventarioPage() {
  const params = useParams();
  const id = Number(params.id); // Ubicacion ID

  const [items, setItems] = useState<ItemInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ItemInventario>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getInventario(id);
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveItem({ ...editingItem, ubicacionId: id });
      setShowModal(false);
      setEditingItem({});
      loadData();
    } catch (error) {
      alert('Error saving item: ' + error);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('¿Estás seguro de eliminar este ítem?')) return;
    try {
      await deleteItem(itemId);
      loadData();
    } catch (error) {
      alert('Error deleting item: ' + error);
    }
  };

  const openNew = () => {
    setEditingItem({
      ubicacionId: id,
      cantidad: 0,
      unidadMedida: 'Unidades',
      categoria: 'General'
    });
    setShowModal(true);
  };

  const openEdit = (item: ItemInventario) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const filteredItems = items.filter(i =>
    i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="text-blue-600" /> Inventario
        </h1>
        <button
          onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Nuevo Ítem
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.categoria}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{item.cantidad}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.unidadMedida}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay items registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingItem.id ? 'Editar Ítem' : 'Nuevo Ítem'}</h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editingItem.nombre || ''}
                  onChange={e => setEditingItem({...editingItem, nombre: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                   <label className="block text-sm font-medium mb-1">Categoría</label>
                   <input
                     type="text"
                     className="w-full p-2 border rounded"
                     value={editingItem.categoria || ''}
                     onChange={e => setEditingItem({...editingItem, categoria: e.target.value})}
                     placeholder="Ej. Maples, Repuestos"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Unidad</label>
                   <input
                     type="text"
                     className="w-full p-2 border rounded"
                     value={editingItem.unidadMedida || ''}
                     onChange={e => setEditingItem({...editingItem, unidadMedida: e.target.value})}
                     placeholder="Ej. Unidades, Kg"
                   />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Cantidad</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={editingItem.cantidad || 0}
                  onChange={e => setEditingItem({...editingItem, cantidad: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={editingItem.descripcion || ''}
                  onChange={e => setEditingItem({...editingItem, descripcion: e.target.value})}
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
