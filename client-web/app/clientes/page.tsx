'use client';

import Header from '@/components/Header';
import Modal from '@/components/Modal';
import { User, Plus, Edit2, DollarSign, ShoppingBag, CreditCard, AlertCircle, History, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import api from '@/lib/axios';

interface Client {
  id: number;
  name: string;
  dni: string;
  address: string;
  addressLocal?: string;
  phone: string;
  debt: number;
  totalSales: number;
  lastPurchase: string;
  paymentMethod: 'Efectivo' | 'MercadoPago' | 'Cuenta Corriente' | string;
  status: 'Activo' | 'Moroso' | 'Inactivo';
  email?: string;
}

interface SaleHistory {
  ventaId: number;
  fecha: string;
  total: number;
  metodoPago: string;
  vendedor: string;
  productos: {
    producto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}

interface PaymentHistory {
  pagoId: number;
  fecha: string;
  monto: number;
  metodoPago: string;
  observacion: string;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // New Modals State
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Data for History
  const [saleHistory, setSaleHistory] = useState<SaleHistory[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [historyTab, setHistoryTab] = useState<'ventas' | 'pagos'>('ventas');

  // Data for Debt Adjustment
  const [debtAction, setDebtAction] = useState<'pagar' | 'ajustar'>('pagar');

  const fetchClients = async () => {
    try {
      const response = await api.get('/clientes');
      const data = response.data.map((c: any) => ({
        id: c.clienteId,
        name: c.nombreCompleto || c.nombre,
        dni: c.dni || '',
        address: c.direccion,
        addressLocal: c.direccionLocal || '',
        phone: c.telefono || '',
        debt: c.deuda || 0,
        totalSales: c.ventasTotales || 0,
        lastPurchase: c.ultimaCompra ? c.ultimaCompra.split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: c.metodoPagoPreferido !== null ? ['Efectivo', 'MercadoPago', 'Desconocido', 'Cuenta Corriente'][c.metodoPagoPreferido] : 'Efectivo',
        status: c.estado || 'Activo',
        email: c.email || '',
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

  // Debt Management Handlers
  const handleOpenDebtModal = (client: Client) => {
    setCurrentClient(client);
    setDebtAction('pagar');
    setIsDebtModalOpen(true);
  };

  const handleDebtSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentClient) return;

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const observation = formData.get('observation') as string;

    try {
      if (debtAction === 'pagar') {
        const paymentMethodStr = formData.get('paymentMethod') as string;
        const paymentMethods = ['Efectivo', 'MercadoPago', 'Desconocido', 'Cuenta Corriente'];
        const paymentMethodIdx = paymentMethods.indexOf(paymentMethodStr);

        await api.post(`/clientes/${currentClient.id}/pagos`, {
          monto: amount,
          metodoPago: paymentMethodIdx >= 0 ? paymentMethodIdx : 0,
          observacion: observation
        });
      } else {
        const type = formData.get('type') as string;
        const isIncrease = type === 'aumento';

        await api.post(`/clientes/${currentClient.id}/ajuste-deuda`, {
          monto: amount,
          esAumento: isIncrease,
          motivo: observation
        });
      }

      setIsDebtModalOpen(false);
      fetchClients();
    } catch (error: any) {
      alert('Error al registrar la transacción: ' + (error.response?.data || error.message));
    }
  };

  // History Handlers
  const handleOpenHistoryModal = async (client: Client) => {
    setCurrentClient(client);
    setIsHistoryModalOpen(true);
    setHistoryTab('ventas'); // Reset tab

    try {
      const [salesRes, paymentsRes] = await Promise.all([
        api.get(`/clientes/${client.id}/historial-ventas`),
        api.get(`/clientes/${client.id}/historial-pagos`)
      ]);
      setSaleHistory(salesRes.data);
      setPaymentHistory(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const paymentMethodStr = formData.get('paymentMethod') as string;
    const paymentMethods = ['Efectivo', 'MercadoPago', 'Desconocido', 'Cuenta Corriente'];
    const paymentMethodIdx = paymentMethods.indexOf(paymentMethodStr);

    const clientData = {
      clienteId: currentClient ? currentClient.id : 0,
      nombreCompleto: formData.get('name'),
      dni: formData.get('dni') || null,
      direccion: formData.get('address'),
      telefono: formData.get('phone') || null,
      estado: formData.get('status'),
      deuda: parseFloat(formData.get('debt') as string) || 0,
      ventasTotales: parseFloat(formData.get('totalSales') as string) || 0,
      ultimaCompra: formData.get('lastPurchase') ? new Date(formData.get('lastPurchase') as string).toISOString() : null,
      metodoPagoPreferido: paymentMethodIdx >= 0 ? paymentMethodIdx : 0,
      email: formData.get('email') ? formData.get('email') : null,
      fechaCumpleanios: new Date().toISOString(),
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
    } catch (error: any) {
      let errorMessage = 'Error al guardar cliente.';
      if (error.response?.data?.mensaje) errorMessage = error.response.data.mensaje;
      alert(errorMessage);
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenHistoryModal(client)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Ver Historial"
                  >
                    <History size={20} />
                  </button>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center
                    ${client.status === 'Activo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      client.status === 'Moroso' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {client.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div
                  className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group relative"
                  onClick={() => handleOpenDebtModal(client)}
                  title="Click para gestionar deuda"
                >
                  <p className="text-xs text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                    <AlertCircle size={14} /> Deuda Actual
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] ml-auto bg-white/50 px-1 rounded">Gestionar</span>
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
                  <span className="font-medium text-slate-800 dark:text-white">{client.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300">DNI</span>
                  <span className="font-medium text-slate-800 dark:text-white">{client.dni || 'N/A'}</span>
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
                Editar Datos
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Main Edit Modal */}
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
            <input name="dni" defaultValue={currentClient?.dni} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección</label>
            <input name="address" defaultValue={currentClient?.address} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" name="email" defaultValue={currentClient?.email} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
              <input name="phone" defaultValue={currentClient?.phone} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
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

          {/* Simplified Financial Info for Edit */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3">Información Financiera</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Deuda ($)</label>
                <input type="number" name="debt" defaultValue={currentClient?.debt} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" readOnly />
                <p className="text-xs text-slate-400">Use "Gestionar Deuda" para modificar.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ventas Totales ($)</label>
                <input type="number" name="totalSales" defaultValue={currentClient?.totalSales} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" readOnly />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Método de Pago Preferido</label>
                <select name="paymentMethod" defaultValue={currentClient?.paymentMethod || 'Efectivo'} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="Efectivo">Efectivo</option>
                  <option value="MercadoPago">MercadoPago</option>
                  <option value="Cuenta Corriente">Cuenta Corriente</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">Guardar Cambios</button>
          </div>
        </form>
      </Modal>

      {/* Debt Management Modal */}
      <Modal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        title={`Gestionar Deuda - ${currentClient?.name}`}
      >
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl mb-4">
            <button
              onClick={() => setDebtAction('pagar')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${debtAction === 'pagar'
                ? 'bg-white dark:bg-slate-600 text-green-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
              Registrar Pago
            </button>
            <button
              onClick={() => setDebtAction('ajustar')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${debtAction === 'ajustar'
                ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
              Ajustar Deuda
            </button>
          </div>

          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
            <p className="text-sm text-slate-500">Deuda Actual</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white">${currentClient?.debt.toLocaleString()}</p>
          </div>

          <form onSubmit={handleDebtSubmit} className="space-y-4">
            {debtAction === 'pagar' ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Monto del Pago</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input type="number" step="0.01" name="amount" required className="w-full pl-9 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Método de Pago</label>
                  <select name="paymentMethod" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="Efectivo">Efectivo</option>
                    <option value="MercadoPago">MercadoPago</option>
                    <option value="Cuenta Corriente">Cuenta Corriente</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Ajuste</label>
                  <select name="type" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="aumento">Aumentar Deuda (Cargo extra, etc.)</option>
                    <option value="disminucion">Disminuir Deuda (Corrección, etc.)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Monto</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input type="number" step="0.01" name="amount" required className="w-full pl-9 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="0.00" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Observación / Motivo</label>
              <textarea name="observation" rows={3} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Detalle de la operación..." />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setIsDebtModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">Confirmar</button>
            </div>
          </form>
        </div>
      </Modal >

      {/* History Modal */}
      < Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)
        }
        title={`Historial - ${currentClient?.name}`}
      >
        <div className="h-[60vh] flex flex-col">
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl mb-4 shrink-0">
            <button
              onClick={() => setHistoryTab('ventas')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${historyTab === 'ventas'
                ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
              Compras
            </button>
            <button
              onClick={() => setHistoryTab('pagos')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${historyTab === 'pagos'
                ? 'bg-white dark:bg-slate-600 text-green-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
              Pagos
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {historyTab === 'ventas' ? (
              <div className="space-y-4">
                {saleHistory.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">No hay historial de compras.</p>
                ) : (
                  saleHistory.map((sale) => (
                    <div key={sale.ventaId} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">Venta #{sale.ventaId}</p>
                          <p className="text-xs text-slate-500">{sale.fecha}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600 dark:text-blue-400">$ {sale.total.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{sale.metodoPago}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {sale.productos.map((prod, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                            <span>{prod.cantidad}x {prod.producto}</span>
                            <span>$ {prod.subtotal.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                        Vendido por: {sale.vendedor}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {paymentHistory.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">No hay historial de pagos.</p>
                ) : (
                  paymentHistory.map((payment) => (
                    <div key={payment.pagoId} className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">Pago</p>
                          <p className="text-xs text-slate-500">{payment.fecha}</p>
                        </div>
                        <p className="font-bold text-green-600 dark:text-green-400 text-lg">$ {payment.monto.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-300 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          {payment.metodoPago}
                        </span>
                      </div>
                      {payment.observacion && (
                        <p className="mt-2 text-sm text-slate-500 italic">"{payment.observacion}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </Modal >
    </div >
  );
}
