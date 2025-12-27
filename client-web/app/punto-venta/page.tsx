'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  User,
  CreditCard,
  Check,
  ArrowLeft,
  Search,
  Plus,
  Truck,
  Wallet,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

// Interfaces
interface Cliente {
  clienteId: number;
  nombreCompleto: string;
  direccion: string;
  listaPreciosId?: number;
}

interface Producto {
  productoId: number;
  nombre: string;
  precioBase: number;
  stockActual: number; // Global Stock
  costoUltimaCompra: number; // For Granja pricing
  esHuevo: boolean;
  unidadesPorBulto: number;
  unidadDeMedida: string;
  precioSugerido?: number;
  precioMinimo?: number;
  precioMaximo?: number;
}

interface Vehiculo {
  vehiculoId: number;
  patente: string;
  marca: string;
  modelo: string;
}

const UNIT_FACTORS_MAP: Record<string, number> = {
  'unidad': 1,
  'maple': 30,
  'cajon': 360,
  'docena': 12
};

const getNormalizedFactor = (targetUnit: string, productUnit: string) => {
  const target = targetUnit.toLowerCase();
  const base = productUnit.toLowerCase();

  const tf = UNIT_FACTORS_MAP[target] || 1;
  const bf = UNIT_FACTORS_MAP[base] || 1;

  return tf / bf;
};

export default function PuntoVentaPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Datos, 2: Productos, 3: Confirmación
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState<number | ''>('');

  // Stock Management
  const [vehicleStock, setVehicleStock] = useState<Map<number, number>>(new Map());
  const [loadingStock, setLoadingStock] = useState(false);

  // Cart
  interface CartItem {
    productoId: number;
    nombre: string;
    cantidad: number; // In selected Unit
    unitType: string;
    factor: number;
    precioUnitario: number; // Price per Unit (calculated)
    precioTotal: number;
    esHuevo: boolean;
  }
  const [cart, setCart] = useState<CartItem[]>([]);

  // Selection State for Product Modal/Panel
  const [searchTerm, setSearchTerm] = useState('');
  const [addingProduct, setAddingProduct] = useState<Producto | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addUnit, setAddUnit] = useState<string>('MAPLE');
  const [addPrice, setAddPrice] = useState<string>(''); // Total price for the batch or price per unit type? Let's use Price per Unit Type displayed

  const [metodoPago, setMetodoPago] = useState<number>(0); // 0: Efectivo
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const getSelectedVehiculoObj = useMemo(() => {
    return vehiculos.find(v => v.vehiculoId === selectedVehiculo);
  }, [selectedVehiculo, vehiculos]);

  const isGranja = getSelectedVehiculoObj?.patente === 'GRANJA';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, productosRes, vehiculosRes] = await Promise.all([
          api.get('/clientes'),
          api.get('/productos'),
          api.get('/vehiculos'),
        ]);

        setClientes(clientesRes.data);
        const productsMapped = productosRes.data.map((p: any) => ({
          productoId: p.productoId,
          nombre: p.nombre,
          precioBase: p.precio || 0, // Assuming 'precio' from API is now 'precioBase'
          stockActual: p.stockActual,
          costoUltimaCompra: p.costoUltimaCompra || 0,
          esHuevo: p.esHuevo,
          unidadesPorBulto: p.unidadesPorBulto || 1,
          unidadDeMedida: p.unidadDeMedida,
          precioSugerido: p.precioSugerido,
          precioMinimo: p.precioMinimo,
          precioMaximo: p.precioMaximo
        }));
        setProductos(productsMapped);
        setVehiculos(vehiculosRes.data);

        if (vehiculosRes.data.length > 0) {
          setSelectedVehiculo(vehiculosRes.data[0].vehiculoId);
        }

        setLoadingData(false);
      } catch (error) {
        console.error('Error fetching data', error);
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

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
      } catch (error) {
        console.error('Error fetching vehicle stock:', error);
      } finally {
        setLoadingStock(false);
      }
    };

    fetchStock();
  }, [selectedVehiculo]);

  // When selecting a product to add
  const openAddProduct = (prod: Producto) => {
    setAddingProduct(prod);
    setAddQuantity(1);

    const isMaple = prod.unidadDeMedida.toLowerCase() === 'maple';
    const initialUnit = prod.esHuevo ? 'MAPLE' : 'UNIDAD';
    setAddUnit(initialUnit);

    const factor = getNormalizedFactor(initialUnit, prod.unidadDeMedida);

    if (prod.precioSugerido && prod.precioSugerido > 0) {
      setAddPrice((prod.precioSugerido * factor).toFixed(2));
    } else if (isGranja) {
      // Cost + 10%
      const costPlus10 = (prod.costoUltimaCompra * 1.10) * factor;
      setAddPrice(Math.round(costPlus10).toFixed(2));
    } else {
      setAddPrice((prod.precioBase * factor).toFixed(2));
    }
  };

  // Update suggested price when Unit changes
  useEffect(() => {
    if (addingProduct) {
      const factor = getNormalizedFactor(addUnit, addingProduct.unidadDeMedida);

      if (addingProduct.precioSugerido && addingProduct.precioSugerido > 0) {
        setAddPrice((addingProduct.precioSugerido * factor).toFixed(2));
      } else if (isGranja) {
        const costPlus10 = (addingProduct.costoUltimaCompra * 1.10) * factor;
        setAddPrice(Math.round(costPlus10).toFixed(2));
      } else {
        setAddPrice((addingProduct.precioBase * factor).toFixed(2));
      }
    }
  }, [addUnit, addingProduct, isGranja]);

  const confirmAddFilter = () => {
    if (!addingProduct) return;

    const qty = addQuantity; // addQuantity is now a number
    const price = parseFloat(addPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      alert("Valores inválidos");
      return;
    }

    const factor = getNormalizedFactor(addUnit, addingProduct.unidadDeMedida);
    const totalUnitsNormalized = qty * factor;

    // Validate Stock
    const currentStock = isGranja ? addingProduct.stockActual : (vehicleStock.get(addingProduct.productoId) || 0);

    // Check if we already have this product in cart to subtract available stock
    const inCart = cart.filter(i => i.productoId === addingProduct.productoId)
      .reduce((acc, i) => {
        let f = i.factor;
        // In cart factor is already normalized relative to product base unit if we stored it correctly?
        // Wait, CartItem factor might need to be store correctly.
        return acc + (i.cantidad * f);
      }, 0);

    if (totalUnitsNormalized + inCart > currentStock) {
      alert(`Stock insuficiente. Disponible: ${(currentStock - inCart).toFixed(2)} ${addingProduct.unidadDeMedida}.`);
      return;
    }

    // Unit Price (Price per ONE egg/unit)
    // The entered price is "Per Unit selected" (e.g., Price per MAPLE)
    // So 'price' is indeed Price Per Selected Unit Type.
    const unitPrice = price / factor;

    // Validate Price Limits
    if (addingProduct.precioMinimo && addingProduct.precioMinimo > 0) {
      if (unitPrice < addingProduct.precioMinimo) {
        alert(`El precio unitario ($${unitPrice.toFixed(2)}) está por debajo del mínimo permitido ($${addingProduct.precioMinimo})`);
        return;
      }
    }
    if (addingProduct.precioMaximo && addingProduct.precioMaximo > 0) {
      if (unitPrice > addingProduct.precioMaximo) {
        alert(`El precio unitario ($${unitPrice.toFixed(2)}) excede el máximo permitido ($${addingProduct.precioMaximo})`);
        return;
      }
    }

    // Then calculateTotals: totalAmount = qty * price.
    // So 'price' is indeed Price Per Selected Unit Type.

    const newItem: CartItem = {
      productoId: addingProduct.productoId,
      nombre: addingProduct.nombre,
      cantidad: qty,
      unitType: addUnit,
      factor: factor,
      precioUnitario: unitPrice, // internally stored as per-single-unit for consistency? Or just keep total.
      precioTotal: qty * price,
      esHuevo: addingProduct.esHuevo
    };

    setCart([...cart, newItem]);
    setAddingProduct(null);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.precioTotal, 0);
  const descuentoMonto = subtotal * (descuentoPorcentaje / 100);
  const total = subtotal - descuentoMonto;

  const filteredClientes = clientes.filter((c) =>
    (c.nombreCompleto || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProductos = productos.filter((p) => {
    // If Granja, show global stock (anything > 0)
    if (isGranja) return p.stockActual > 0;
    // If regular vehicle, show local stock
    return vehicleStock.has(p.productoId);
  }).filter((p) =>
    (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmVenta = async () => {
    if (!selectedCliente || !selectedVehiculo) {
      alert('Falta seleccionar cliente o vehículo');
      return;
    }

    if (metodoPago === 3) {
      if (!fechaVencimiento) {
        alert('Debe indicar una fecha de pago para Cuenta Corriente.');
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(fechaVencimiento);
      // Fix timezone / comparison
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (dueDay <= currentDay) {
        alert('La fecha de pago debe ser mayor a la fecha actual.');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Group items by product? Backend seems to handle individual items.
      const itemsPayload = cart.map(item => {
        const factor = item.factor; // Factor from cart is already relative to product unit
        return {
          productoId: item.productoId,
          cantidad: item.cantidad * factor,
          precioUnitario: item.precioTotal / (item.cantidad * factor)
        };
      });

      const payload = {
        clienteId: selectedCliente,
        usuarioId: user?.UsuarioId || 1,
        vehiculoId: Number(selectedVehiculo),
        metodoPago: metodoPago,
        fecha: new Date().toISOString(),
        fechaVencimientoPago: metodoPago === 3 ? new Date(fechaVencimiento).toISOString() : null,
        descuentoPorcentaje: descuentoPorcentaje,
        items: itemsPayload,
      };

      await api.post('/ventas', payload);
      alert('Venta Registrada Exitosamente!');
      // Reset
      setCart([]);
      setStep(1);
      setSelectedCliente(null);
      setDescuentoPorcentaje(0);
    } catch (error) {
      console.error(error);
      alert('Error al registrar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Venta (Admin)</h1>
        <div className="ml-auto flex items-center gap-4">
          <NotificationBell />
          <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Paso {step}/3
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        {/* Paso 1: Selección de Cliente y Vehiculo */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vehículo (Origen del Stock)
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-3 text-gray-400" size={20} />
                <select
                  value={selectedVehiculo}
                  onChange={(e) => setSelectedVehiculo(Number(e.target.value))}
                  className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="">Seleccionar Vehículo</option>
                  {vehiculos.map((v) => (
                    <option key={v.vehiculoId} value={v.vehiculoId}>
                      {v.marca} {v.modelo} ({v.patente})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {loadingData ? (
                <p className="text-center p-4">Cargando...</p>
              ) : (
                filteredClientes.map((cliente) => (
                  <button
                    key={cliente.clienteId}
                    onClick={() => {
                      setSelectedCliente(cliente.clienteId);
                      setStep(2);
                    }}
                    className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-all flex items-center gap-4 group"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <User
                        size={20}
                        className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {cliente.nombreCompleto || 'Sin Nombre'}
                      </p>
                      <p className="text-sm text-gray-500">{cliente.direccion || 'Sin dirección'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Paso 2: Selección de Productos */}
        {step === 2 && (
          <div className="space-y-6">
            {!addingProduct ? (
              // List Products
              <div className="grid grid-cols-1 gap-3 pb-24">
                {loadingStock ? (
                  <p className="text-center">Cargando Stock...</p>
                ) : (
                  filteredProductos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full text-orange-600 dark:text-orange-400 mb-4">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        No hay stock en este vehículo
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                        Para realizar ventas, primero debes cargar mercadería en el vehículo (o en la Granja).
                      </p>
                      <Link
                        href="/carga-camioneta"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                      >
                        <Truck size={20} />
                        Ir a Cargar Stock
                      </Link>
                    </div>
                  ) : (
                    filteredProductos.map((prod) => (
                      <div
                        key={prod.productoId}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{prod.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {isGranja ? (
                              <>
                                Global: {prod.stockActual.toLocaleString()} {prod.unidadDeMedida}
                                {prod.esHuevo && prod.unidadDeMedida.toLowerCase() !== 'maple' && ` (~${Math.floor(prod.stockActual / 30)} maples)`}
                              </>
                            ) : (
                              <>
                                Disp: {(vehicleStock.get(prod.productoId) || 0).toLocaleString()} {prod.unidadDeMedida}
                                {prod.esHuevo && prod.unidadDeMedida.toLowerCase() !== 'maple' && ` (~${Math.floor((vehicleStock.get(prod.productoId) || 0) / 30)} maples)`}
                              </>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => openAddProduct(prod)}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    ))
                  )
                )}
              </div>
            ) : (
              // Add Product Detail
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <h3 className="font-bold text-lg dark:text-white">{addingProduct.nombre}</h3>

                {addingProduct.esHuevo ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unidad de Medida</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['UNIDAD', 'MAPLE', 'CAJON'].map(u => (
                        <button
                          key={u}
                          onClick={() => setAddUnit(u)}
                          className={`p-2 rounded-lg text-sm font-bold border ${addUnit === u ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : <p className="text-sm text-gray-500">Unidad: UNIDAD</p>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
                    <input
                      type="number"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Precio ({addUnit})</label>
                    <input
                      type="number"
                      value={addPrice}
                      onChange={(e) => setAddPrice(e.target.value)}
                      className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setAddingProduct(null)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmAddFilter}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {/* Resumen Carrito Flotante */}
            {cart.length > 0 && !addingProduct && (
              <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20">
                <div className="max-w-lg mx-auto">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500">
                      Total ({cart.length} items)
                    </span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${subtotal.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
                  >
                    Continuar al Pago
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paso 3: Confirmación y Pago */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Resumen del Pedido
              </h3>
              <div className="space-y-3 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.nombre}</p>
                      <p className="text-gray-500 text-xs">
                        {item.cantidad} {item.unitType} x ${((item.precioTotal / item.cantidad)).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${item.precioTotal.toLocaleString()}
                      </span>
                      <button onClick={() => removeFromCart(idx)} className="text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Descuentos */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aplicar Descuento
                </label>
                <div className="flex gap-2">
                  {[0, 5, 10].map((disc) => (
                    <button
                      key={disc}
                      onClick={() => setDescuentoPorcentaje(disc)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${descuentoPorcentaje === disc
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {disc === 0 ? 'Sin desc.' : `${disc}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                {descuentoPorcentaje > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Descuento ({descuentoPorcentaje}%)</span>
                    <span>-${descuentoMonto.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span>Total a Pagar</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setMetodoPago(0)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${metodoPago === 0 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  <Wallet size={24} />
                  Efectivo
                </button>
                <button
                  onClick={() => setMetodoPago(1)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${metodoPago === 1 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  <CreditCard size={24} />
                  MercadoPago
                </button>
                <button
                  onClick={() => setMetodoPago(3)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${metodoPago === 3 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  <User size={24} />
                  Cta. Corriente
                </button>
              </div>

              {metodoPago === 3 && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cuándo pagaría?
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={fechaVencimiento}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                      className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Si se pasa de esta fecha, el cliente pasará a estado MOROSO.
                  </p>
                </div>
              )}
            </div>

            <button
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 hover:bg-green-700 transition-colors flex justify-center items-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirmVenta}
              disabled={submitting}
            >
              <Check size={24} />
              {submitting ? 'Registrando...' : 'Confirmar Venta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
