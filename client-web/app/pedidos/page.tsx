'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, User, Package, Trash2, Edit, CheckCircle, Clock, Truck, MoreVertical, X, AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';
import Modal from '@/components/Modal';
import { Pedido, EstadoPedido } from '@/types/pedido';

export default function PedidosPage() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [clientes, setClientes] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        clienteId: '',
        observaciones: '',
        estaPagado: false,
        items: [] as { productoId: number; cantidad: number; unidad: string; precioUnitario: number }[]
    });

    const [newItem, setNewItem] = useState({ productoId: 0, cantidad: 1, unidad: 'Maple', precioUnitario: 0 });

    useEffect(() => {
        fetchPedidos();
        fetchResources();
    }, []);

    const fetchPedidos = async () => {
        try {
            const res = await api.get('/pedidos/pendientes');
            setPedidos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        try {
            const [cRes, pRes] = await Promise.all([
                api.get('/clientes'),
                api.get('/productos')
            ]);
            setClientes(cRes.data);
            setProductos(pRes.data);
            if (pRes.data.length > 0) {
                setNewItem(prev => ({ ...prev, productoId: pRes.data[0].productoId }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddItem = () => {
        if (!newItem.productoId) return;
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...newItem }]
        }));
    };

    // Update Price when Product/Unit changes
    useEffect(() => {
        if (newItem.productoId) {
            const prod = productos.find(p => p.productoId === newItem.productoId);
            if (prod) {
                const factors: Record<string, number> = {
                    'unidad': 1,
                    'maple': 30,
                    'cajon': 360,
                    'docena': 12
                };

                // Get the factor for the PRODUCT'S base unit (how it's priced in DB)
                const productUnitFactor = factors[prod.unidadDeMedida?.toLowerCase()] || 1;

                // Get the factor for the SELECTED unit (how we are selling it)
                const targetUnitFactor = factors[newItem.unidad.toLowerCase()] || 1;

                let basePrice = prod.precioSugerido || prod.precioMinimo || 0;

                // Calculate Price Per Unit first, then multiply by Target Factor
                const pricePerUnit = basePrice / productUnitFactor;
                const finalPrice = pricePerUnit * targetUnitFactor;

                setNewItem(prev => ({ ...prev, precioUnitario: Math.round(finalPrice) }));
            }
        }
    }, [newItem.productoId, newItem.unidad, productos]);

    const handleRemoveItem = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }));
    };

    const handleSubmit = async () => {
        if (!formData.clienteId || formData.items.length === 0) {
            alert('Seleccione cliente e items');
            return;
        }

        try {
            const payload = {
                clienteId: Number(formData.clienteId),
                observaciones: formData.observaciones,
                estaPagado: formData.estaPagado,
                detalles: formData.items.map(i => ({
                    productoId: i.productoId,
                    cantidad: i.cantidad,
                    unidad: i.unidad,
                    precioUnitario: i.precioUnitario
                }))
            };

            await api.post('/pedidos', payload);
            setIsModalOpen(false);
            setFormData({ clienteId: '', observaciones: '', estaPagado: false, items: [] });
            fetchPedidos();
        } catch (err) {
            console.error(err);
            alert('Error al crear pedido');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Está seguro de eliminar este pedido?')) return;
        try {
            await api.delete(`/pedidos/${id}`);
            setPedidos(prev => prev.filter(p => p.pedidoId !== id));
        } catch (error) {
            console.error(error);
            alert('Error al eliminar el pedido.');
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Pedidos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de pedidos pendientes y reparto</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={20} /> Nuevo Pedido
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pedidos.map(pedido => {
                        // Safe accessor for Client Name
                        const clienteNombre = pedido.cliente?.nombreCompleto || pedido.cliente?.nombre || pedido.clienteNombre || `Cliente #${pedido.clienteId}`;

                        return (
                            <div key={pedido.pedidoId} className="group bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900/30 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-[4rem] -mr-8 -mt-8 pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                            {clienteNombre[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">
                                                {clienteNombre}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium">#{pedido.pedidoId}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${pedido.estado === EstadoPedido.Pendiente ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        pedido.estado === EstadoPedido.Asignado ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            'bg-green-50 text-green-600 border-green-100'
                                        }`}>
                                        {EstadoPedido[pedido.estado]}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span>{new Date(pedido.fechaPedido).toLocaleDateString()}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 space-y-2">
                                        {pedido.detalles.map((d, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{d.cantidad} {d.unidad}</span>
                                                    <span className="text-slate-500 dark:text-slate-500">
                                                        {d.producto?.nombre || d.productoNombre || `Prod #${d.productoId}`}
                                                    </span>
                                                </div>
                                                <div className="text-slate-400 text-xs">
                                                    ${d.subtotal ? d.subtotal.toLocaleString() : (d.cantidad * d.precioUnitario).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {pedido.observaciones && (
                                        <div className="flex items-start gap-2 text-xs text-slate-500 italic bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg">
                                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                                            {pedido.observaciones}
                                        </div>
                                    )}
                                </div>

                                {pedido.totalEstimado && pedido.totalEstimado > 0 && (
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl mt-3">
                                        <span className="text-sm font-bold text-slate-500">Total Estimado</span>
                                        <span className="text-lg font-black text-slate-800 dark:text-white">${pedido.totalEstimado.toLocaleString()}</span>
                                    </div>
                                )}


                                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                        onClick={() => handleDelete(pedido.pedidoId)}
                                        className="flex-1 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {pedidos.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No hay pedidos pendientes</h3>
                            <p className="text-slate-400">Crea uno nuevo para comenzar.</p>
                        </div>
                    )}
                </div>
            )
            }

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Pedido">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Cliente</label>
                        <select
                            value={formData.clienteId}
                            onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Seleccione Cliente...</option>
                            {clientes.map(c => (
                                <option key={c.clienteId} value={c.clienteId}>{c.nombreCompleto || c.nombre || "Cliente " + c.clienteId}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Items del Pedido</label>

                        <div className="flex flex-wrap gap-2 mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            <select
                                value={newItem.productoId}
                                onChange={e => setNewItem({ ...newItem, productoId: Number(e.target.value) })}
                                className="flex-[2] min-w-[140px] p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium"
                            >
                                <option value={0}>Producto...</option>
                                {productos.map(p => (
                                    <option key={p.productoId} value={p.productoId}>{p.nombre}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={newItem.cantidad}
                                onChange={e => setNewItem({ ...newItem, cantidad: Number(e.target.value) })}
                                className="flex-1 w-16 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-center"
                                min="1"
                            />
                            <select
                                value={newItem.unidad}
                                onChange={e => setNewItem({ ...newItem, unidad: e.target.value })}
                                className="flex-1 min-w-[80px] p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium"
                            >
                                <option value="Unidad">Unidad</option>
                                <option value="Docena">Docena</option>
                                <option value="Maple">Maple</option>
                                <option value="Cajon">Cajon</option>
                            </select>
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 w-24">
                                <span className="text-slate-400 text-xs">$</span>
                                <input
                                    type="number"
                                    value={newItem.precioUnitario}
                                    onChange={e => setNewItem({ ...newItem, precioUnitario: Number(e.target.value) })}
                                    className="w-full bg-transparent text-sm font-medium outline-none"
                                    placeholder="Precio"
                                />
                            </div>
                            <button
                                onClick={handleAddItem}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        {newItem.productoId > 0 && newItem.unidad !== 'Unidad' && (
                            <div className="text-xs text-slate-500 text-right px-1 mb-4">
                                Equivalente a <span className="font-bold">
                                    {(newItem.cantidad * ({ 'maple': 30, 'cajon': 360, 'docena': 12 }[newItem.unidad.toLowerCase()] || 1)).toLocaleString()} Unidades
                                </span>
                            </div>
                        )}

                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold px-2 py-1 rounded text-xs">
                                            {item.cantidad} {item.unidad}
                                        </span>
                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                            {productos.find(p => p.productoId === item.productoId)?.nombre}
                                        </span>
                                    </div>
                                    <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {formData.items.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                    <p className="text-sm text-slate-400">Agrega productos al pedido</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Observaciones</label>
                        <textarea
                            value={formData.observaciones}
                            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Instrucciones especiales para el reparto..."
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input
                            type="checkbox"
                            checked={formData.estaPagado}
                            onChange={(e) => setFormData({ ...formData, estaPagado: e.target.checked })}
                            id="estaPagado"
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="estaPagado" className="font-bold text-slate-700 dark:text-slate-200">
                            Pedido COBRADO (No cobrar al entregar)
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={formData.items.length === 0 || !formData.clienteId}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Guardar Pedido
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
