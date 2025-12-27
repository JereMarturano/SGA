'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Truck,
  User,
  ShoppingCart,
  DollarSign,
  Save,
  AlertCircle,
  CheckCircle,
  Search,
  X,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Interfaces
interface Vehiculo {
  vehiculoId: number;
  patente: string;
  marca: string;
  modelo: string;
}

interface Cliente {
  clienteId: number;
  nombre: string;
  apellido?: string;
  nombreCompleto?: string; // Helper
}

interface Producto {
  productoId: number;
  nombre: string;
  esHuevo: boolean;
  costoUltimaCompra: number;
  unidadDeMedida: string; // [FIX] Added to track base unit
}

type UnitType = 'UNIDAD' | 'MAPLE' | 'CAJON';

// Default factors (display only, normalization handled by helper)
const UNIT_FACTORS_DISPLAY: Record<UnitType, number> = {
  UNIDAD: 1,
  MAPLE: 30,
  CAJON: 360,
};

const getNormalizedFactor = (targetUnit: string, productUnit: string) => {
  const factors: Record<string, number> = {
    'unidad': 1,
    'maple': 30,
    'cajon': 360,
  };
  const target = factors[targetUnit.toLowerCase()] || 1;
  const base = factors[productUnit.toLowerCase()] || 1;
  return target / base;
};

export default function SimulacionVentasPage() {
  // Data states
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  // Fecha and Hora removed for automatic setting
  const [selectedVehiculo, setSelectedVehiculo] = useState<number | ''>('');
  const [isChoferTrip, setIsChoferTrip] = useState(false);

  // Client Selection State
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const [selectedProducto, setSelectedProducto] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<string>('');
  const [unitType, setUnitType] = useState<UnitType>('MAPLE');
  const [precio, setPrecio] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<number>(0); // 0: Efectivo, 3: Cta Cte
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('');

  // Stock Management
  const [vehicleStock, setVehicleStock] = useState<Map<number, number>>(new Map());
  const [loadingStock, setLoadingStock] = useState(false);

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      try {
        const [vehiculosRes, clientesRes, productosRes] = await Promise.all([
          api.get('/vehiculos'),
          api.get('/clientes'),
          api.get('/productos'),
        ]);

        if (user?.Rol === 'Chofer') {
          try {
            const tripRes = await api.get(`/viajes/activo-por-usuario/${user.UsuarioId}`);
            if (tripRes.data && tripRes.data.vehiculoId) {
              setSelectedVehiculo(tripRes.data.vehiculoId);
              setIsChoferTrip(true);
            }
          } catch (err) {
            console.log("No active trip for chofer", err);
          }
        }

        setVehiculos(vehiculosRes.data);
        setClientes(
          clientesRes.data.map((c: any) => ({
            ...c,
            nombreCompleto: c.nombreCompleto || `${c.nombre} ${c.apellido || ''}`.trim(),
          }))
        );
        // Filter only eggs as requested and map unit
        setProductos(productosRes.data.filter((p: any) => p.esHuevo).map((p: any) => ({
          ...p,
          unidadDeMedida: p.unidadDeMedida || 'UNIDAD'
        })));
        setLoadingData(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setMessage({ type: 'error', text: 'Error al cargar datos iniciales.' });
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router, user, user?.Rol]);

  // Fetch stock when vehicle changes
  useEffect(() => {
    if (!selectedVehiculo) {
      setVehicleStock(new Map());
      return;
    }

    const fetchStock = async () => {
      setLoadingStock(true);
      try {
        const res = await api.get(`/inventario/stock-vehiculo/${selectedVehiculo}`);
        const stockMap = new Map<number, number>();
        res.data.forEach((item: any) => {
          if (item.cantidad > 0) {
            stockMap.set(item.productoId, item.cantidad);
          }
        });
        setVehicleStock(stockMap);

        // Reset selected product if not in new stock
        if (selectedProducto && !stockMap.has(Number(selectedProducto))) {
          setSelectedProducto('');
        }
      } catch (error) {
        console.error('Error fetching vehicle stock:', error);
        setMessage({ type: 'error', text: 'Error al cargar el stock del vehículo.' });
      } finally {
        setLoadingStock(false);
      }
    };

    fetchStock();
  }, [selectedVehiculo, selectedProducto]);

  // Filter available products based on stock
  const availableProducts = useMemo(() => {
    if (!selectedVehiculo) return [];
    return productos.filter((p) => vehicleStock.has(p.productoId));
  }, [productos, vehicleStock, selectedVehiculo]);

  // Filtered Clients
  const filteredClientes = useMemo(() => {
    if (!clientSearch) return clientes.slice(0, 10); // Show first 10 if no search
    return clientes
      .filter((c) => c.nombreCompleto?.toLowerCase().includes(clientSearch.toLowerCase()))
      .slice(0, 10);
  }, [clientes, clientSearch]);

  // Update price when product or unit type changes
  useEffect(() => {
    if (selectedProducto && unitType) {
      const prod = productos.find((p) => p.productoId === selectedProducto);
      if (prod && prod.costoUltimaCompra > 0) {
        // Calculate factor relative to Base Unit
        const factor = getNormalizedFactor(unitType, prod.unidadDeMedida);
        const costPerUnit = prod.costoUltimaCompra * factor;
        const suggestedPrice = costPerUnit * 1.1; // +10% margin
        setPrecio(suggestedPrice.toFixed(2));
      }
    }
  }, [selectedProducto, unitType, productos]);

  const calculateTotals = () => {
    const qty = parseFloat(cantidad) || 0;
    const price = parseFloat(precio) || 0;

    // [FIX] Use Normalized Factor
    const prod = productos.find(p => p.productoId === Number(selectedProducto));
    const factorToBase = prod ? getNormalizedFactor(unitType, prod.unidadDeMedida) : 1;

    const totalUnitsNormalized = qty * factorToBase; // This is Quantity in Base Units (e.g. Maples)

    // For display "Total Huevos" we verify base unit
    let totalHuevos = 0;
    if (prod?.unidadDeMedida?.toLowerCase() === 'maple' || prod?.unidadDeMedida?.toLowerCase() === 'cajon') {
      totalHuevos = totalUnitsNormalized * 30;
    } else {
      totalHuevos = totalUnitsNormalized;
    }

    const unitPrice = totalUnitsNormalized > 0 ? price / factorToBase : 0; // Price per Base Unit
    const totalAmount = qty * price;

    return { totalUnits: totalUnitsNormalized, totalHuevosDisplay: totalHuevos, unitPrice, totalAmount };
  };

  const validatePrice = () => {
    if (!selectedProducto || !precio) return true;
    const prod = productos.find((p) => p.productoId === selectedProducto);
    if (!prod) return true;

    const { unitPrice } = calculateTotals();

    // Validate against cost (must be greater than cost)
    if (prod.costoUltimaCompra > 0 && unitPrice <= prod.costoUltimaCompra) {
      return false;
    }
    return true;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handlePreSubmit triggered');
    setMessage(null);

    if (!selectedVehiculo || !selectedCliente || !selectedProducto || !cantidad || !precio) {
      setMessage({ type: 'error', text: 'Por favor complete todos los campos requeridos.' });
      return;
    }

    if (metodoPago === 3 && !fechaVencimiento) {
      setMessage({ type: 'error', text: 'Debe indicar una fecha de pago para Cuenta Corriente.' });
      return;
    }

    if (metodoPago === 3 && fechaVencimiento) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(fechaVencimiento);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (dueDay <= currentDay) {
        setMessage({ type: 'error', text: 'La fecha de pago debe ser mayor a la fecha actual.' });
        return;
      }
    }

    if (!validatePrice()) {
      setMessage({
        type: 'error',
        text: 'El precio de venta es menor o igual al costo de compra. Verifique el precio.',
      });
      return;
    }

    // Validate Stock
    const { totalUnits } = calculateTotals(); // totalUnits is in Base Unit
    const currentStock = vehicleStock.get(Number(selectedProducto)) || 0; // currentStock is in Base Unit

    console.log('Stock Validation:', { totalUnits, currentStock });

    if (totalUnits > currentStock) {
      const prod = productos.find(p => p.productoId === Number(selectedProducto));
      const uom = prod?.unidadDeMedida || 'Unidad';
      setMessage({
        type: 'error',
        text: `Stock insuficiente. Disponible: ${currentStock.toLocaleString()} ${uom}.`,
      });
      return;
    }

    console.log('Opening Confirm Modal');
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const { totalUnits, unitPrice } = calculateTotals();

      const payload = {
        clienteId: selectedCliente?.clienteId,
        usuarioId: user?.UsuarioId,
        vehiculoId: Number(selectedVehiculo),
        metodoPago: Number(metodoPago),
        fecha: new Date().toISOString(), // Ignored by backend but sent for DTO validity
        fechaVencimientoPago: metodoPago === 3 ? new Date(fechaVencimiento).toISOString() : null,
        items: [
          {
            productoId: Number(selectedProducto),
            cantidad: totalUnits, // Sends correct quantity in Base Unit (1 Cajon -> 12 Maples)
            precioUnitario: unitPrice,
          },
        ],
      };

      await api.post('/ventas', payload);

      setMessage({ type: 'success', text: 'Venta simulada registrada exitosamente.' });

      // Reset fields
      setCantidad('');
      setPrecio('');
      setFechaVencimiento('');
    } catch (error: any) {
      console.error('Error submitting sale:', error);
      const errorMsg =
        error.response?.data?.message || error.message || 'Error al registrar la venta.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const { totalUnits, totalHuevosDisplay, unitPrice, totalAmount } = calculateTotals();
  const selectedProdData = productos.find((p) => p.productoId === selectedProducto);

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
        Cargando datos...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="text-slate-600 dark:text-slate-300" size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Simulación de Ventas
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Registrar ventas manuales o históricas
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
          <form onSubmit={handlePreSubmit} className="space-y-8">
            {/* Vehículo y Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Vehículo
                </label>
                <div className="relative">
                  <Truck className="absolute left-3 top-3.5 text-slate-400" size={20} />
                  <select
                    value={selectedVehiculo}
                    onChange={(e) => setSelectedVehiculo(Number(e.target.value))}
                    disabled={isChoferTrip}
                    className={`w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium ${isChoferTrip ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''}`}
                    required
                  >
                    <option value="">Seleccionar Vehículo</option>
                    {vehiculos
                      .filter((v) => !isChoferTrip || v.vehiculoId === selectedVehiculo)
                      .map((v) => (
                        <option key={v.vehiculoId} value={v.vehiculoId}>
                          {v.marca} {v.modelo} ({v.patente})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Custom Client Selector */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Cliente
                </label>
                <div className="relative">
                  <div
                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer flex items-center justify-between"
                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  >
                    <User className="absolute left-3 text-slate-400" size={20} />
                    <span className={selectedCliente ? 'font-bold' : 'text-slate-400'}>
                      {selectedCliente ? selectedCliente.nombreCompleto : 'Buscar Cliente...'}
                    </span>
                  </div>

                  {isClientDropdownOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                          <input
                            type="text"
                            placeholder="Filtrar clientes..."
                            className="w-full pl-9 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredClientes.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-sm">
                            No se encontraron clientes
                          </div>
                        ) : (
                          filteredClientes.map((c) => (
                            <div
                              key={c.clienteId}
                              onClick={() => {
                                setSelectedCliente(c);
                                setIsClientDropdownOpen(false);
                                setClientSearch('');
                              }}
                              className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                            >
                              <p className="font-bold text-slate-800 dark:text-white text-sm">
                                {c.nombreCompleto}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {isClientDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsClientDropdownOpen(false)}
                  ></div>
                )}
              </div>
            </div>

            {/* Producto */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Producto (Huevo)
              </label>
              <div className="relative">
                <ShoppingCart className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <select
                  value={selectedProducto}
                  onChange={(e) => setSelectedProducto(Number(e.target.value))}
                  className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium"
                  required
                >
                  <option value="">
                    {loadingStock ? 'Cargando stock...' : 'Seleccionar Producto'}
                  </option>
                  {availableProducts.map((p) => {
                    const qty = vehicleStock.get(p.productoId) || 0;
                    // Only display maples if base unit is maple or huge quantity
                    // For clarity: Show Qty + BaseUnit
                    return (
                      <option key={p.productoId} value={p.productoId}>
                        {p.nombre} (Disp: {qty.toLocaleString()} {p.unidadDeMedida})
                      </option>
                    );
                  })}
                </select>
              </div>
              {selectedProdData && selectedProdData.costoUltimaCompra > 0 && (
                <p className="text-xs text-slate-500 pl-2">
                  Costo ref ({unitType}): $
                  {(selectedProdData.costoUltimaCompra * getNormalizedFactor(unitType, selectedProdData.unidadDeMedida)).toFixed(2)} (+10%
                  ganancia)
                </p>
              )}
            </div>

            {/* Cantidad y Precio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tipo Cantidad
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as UnitType)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  <option value="UNIDAD">Unidad</option>
                  <option value="MAPLE">Maple</option>
                  <option value="CAJON">Cajón</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  required
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Precio ({unitType})
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={20} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Total a Pagar</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">
                  ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold">Total Huevos</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(totalHuevosDisplay).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setMetodoPago(0)}
                  className={`p-4 rounded-xl border-2 transition-all font-bold ${metodoPago === 0 ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago(1)}
                  className={`p-4 rounded-xl border-2 transition-all font-bold ${metodoPago === 1 ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  MercadoPago
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago(3)}
                  className={`p-4 rounded-xl border-2 transition-all font-bold ${metodoPago === 3 ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  Cuenta Corriente
                </button>
              </div>

              {metodoPago === 3 && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    ¿Cuándo pagaría?
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-slate-400" size={20} />
                    <input
                      type="date"
                      value={fechaVencimiento}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                      className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      required
                    />
                  </div>
                  <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Si se pasa de esta fecha, el cliente pasará a estado MOROSO.
                  </p>
                </div>
              )}
            </div>

            {/* Mensajes */}
            {message && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}
              >
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <p className="font-medium">{message.text}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {submitting ? (
                'Procesando...'
              ) : (
                <>
                  <Save size={20} />
                  Registrar Venta
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Venta"
        footer={
          <>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
            >
              <CheckCircle size={18} /> Confirmar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
              Resumen de la operación
            </h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>
                <strong>Cliente:</strong> {selectedCliente?.nombreCompleto}
              </li>
              <li>
                <strong>Producto:</strong> {selectedProdData?.nombre}
              </li>
              <li>
                <strong>Cantidad:</strong> {cantidad} {unitType} ({Math.round(totalHuevosDisplay)} huevos)
              </li>
              <li>
                <strong>Total:</strong> $
                {totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </li>
              <li>
                <strong>Pago:</strong>{' '}
                {metodoPago === 3 ? `Cuenta Corriente (Vence: ${fechaVencimiento})` : 'Efectivo'}
              </li>
            </ul>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            ¿Está seguro de registrar esta venta? Esto descontará stock del vehículo seleccionado.
          </p>
        </div>
      </Modal>
    </div>
  );
}
