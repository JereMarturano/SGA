'use client';

import Header from '@/components/Header';
import Modal from '@/components/Modal';
import { User, Plus, Edit2, DollarSign, ShoppingBag, CreditCard, AlertCircle } from 'lucide-react';
import { useState } from 'react';

import api from '@/lib/axios';
import { useEffect } from 'react';

interface Client {
  id: number;
  name: string;
  dni: string;
  address: string;
  phone: string;
  debt: number;
  totalSales: number;
  lastPurchase: string;
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Cheque' | 'Cuenta Corriente';
  status: 'Activo' | 'Moroso' | 'Inactivo';
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clientes');
      const data = response.data.map((c: any) => ({
        id: c.clienteId,
        name: c.nombreCompleto || c.nombre,
        dni: c.dni || '00000000',
        address: c.direccion,
        phone: c.telefono || 'N/A',
        debt: c.deuda || 0,
        totalSales: c.ventasTotales || 0,
        lastPurchase: c.ultimaCompra ? c.ultimaCompra.split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: c.metodoPagoPreferido !== null ? ['Efectivo', 'Transferencia', 'Cheque', 'Cuenta Corriente', 'Tarjeta'][c.metodoPagoPreferido] : 'Efectivo',
        status: c.estado || 'Activo',
      }));
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleEdit = (client: Client) => {
    setCurrentClient(client);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setCurrentClient(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentClient(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Convert payment method string to enum value for backend
    const paymentMethodStr = formData.get('paymentMethod') as string;
    const paymentMethods = ['Efectivo', 'Transferencia', 'Cheque', 'Cuenta Corriente', 'Tarjeta'];
    const paymentMethodIdx = paymentMethods.indexOf(paymentMethodStr);

    const clientData = {
      clienteId: currentClient ? currentClient.id : 0,
      nombreCompleto: formData.get('name'),
      dni: formData.get('dni') || '00000000',
      direccion: formData.get('address'),
      telefono: formData.get('phone'),
      estado: formData.get('status'),
      deuda: parseFloat(formData.get('debt') as string) || 0,
      ventasTotales: parseFloat(formData.get('totalSales') as string) || 0,
      ultimaCompra: formData.get('lastPurchase') ? new Date(formData.get('lastPurchase') as string).toISOString() : null,
      metodoPagoPreferido: paymentMethodIdx >= 0 ? paymentMethodIdx : 0,
      email: '', // Not in form
      fechaCumpleanios: new Date().toISOString(), // Default
      requiereFactura: false
    };

    try {
      if (currentClient) {
        await api.put(`/clientes/${currentClient.id}`, clientData);
      } else {
        await api.post('/clientes', clientData);
      }

      fetchClients();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error al guardar cliente. Verifique los datos.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white">Clientes</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de cuentas y ventas</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{client.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      {client.address}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold
                  ${client.status === 'Activo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    client.status === 'Moroso' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {client.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                  <p className="text-xs text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                    <AlertCircle size={14} /> Deuda Actual
                  </p>
                  <p className="font-bold text-red-700 dark:text-red-500 text-lg">$ {client.debt.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                    <ShoppingBag size={14} /> Compras Totales
                  </p>
                  <p className="font-bold text-green-700 dark:text-green-500 text-lg">$ {client.totalSales.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Teléfono</span>
                  <span className="font-medium text-slate-800 dark:text-white">{client.phone}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300">DNI</span>
                  <span className="font-medium text-slate-800 dark:text-white">{client.dni}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Última Compra</span>
                  <span className="font-medium text-slate-800 dark:text-white">{new Date(client.lastPurchase).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <CreditCard size={14} /> Forma de Pago
                  </span>
                  <span className="font-medium text-slate-800 dark:text-white">{client.paymentMethod}</span>
                </div>
              </div>

              <button
                onClick={() => handleEdit(client)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 size={16} />
                Gestionar Cuenta
              </button>
            </div>
          ))}
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentClient ? `Editar ${currentClient.name}` : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre / Razón Social</label>
            <input name="name" defaultValue={currentClient?.name} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">DNI</label>
            <input name="dni" defaultValue={currentClient?.dni} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</label>
            <input name="address" defaultValue={currentClient?.address} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
              <input name="phone" defaultValue={currentClient?.phone} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
              <select name="status" defaultValue={currentClient?.status || 'Activo'} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Activo">Activo</option>
                <option value="Moroso">Moroso</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3">Información Financiera</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Deuda ($)</label>
                <input type="number" name="debt" defaultValue={currentClient?.debt} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ventas Totales ($)</label>
                <input type="number" name="totalSales" defaultValue={currentClient?.totalSales} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Método de Pago</label>
                <select name="paymentMethod" defaultValue={currentClient?.paymentMethod || 'Efectivo'} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cuenta Corriente">Cuenta Corriente</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Última Compra</label>
                <input type="date" name="lastPurchase" defaultValue={currentClient?.lastPurchase} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">Guardar Cambios</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
