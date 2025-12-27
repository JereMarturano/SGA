'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Truck, ArrowLeft, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

interface StockDetalle {
  producto: string;
  cantidad: number;
}

interface VentaSimplificada {
  ventaId: number;
  fecha: string;
  clienteNombre: string;
  total: number;
  metodoPago: string;
  cantidadItems: number;
}

interface StockEnCalle {
  vehiculoId: number;
  vehiculoNombre: string;
  enRuta: boolean;
  kilometraje: number;
  stock: StockDetalle[];
  choferNombre?: string;
  ultimaVentaFecha?: string;
  ultimaVentaTotal?: number;
  ultimaVentaCliente?: string;
  historialVentas?: VentaSimplificada[];
}

interface StockVehiculoItem {
  id: number;
  vehiculoId: number;
  productoId: number;
  cantidad: number;
  producto: {
    productoId: number;
    nombre: string;
  };
}

interface CerrarRepartoModalProps {
  vehiculo: StockEnCalle;
  onClose: () => void;
  onSuccess: () => void;
}

interface HistorialVentasModalProps {
  vehiculo: StockEnCalle;
  onClose: () => void;
}

type UnitType = 'UNIDAD' | 'MAPLE' | 'CAJON';

const UNIT_FACTORS: Record<UnitType, number> = {
  UNIDAD: 1,
  MAPLE: 30,
  CAJON: 360,
};

interface ResumenCaja {
  totalEsperado: number;
  totalVentas: number;
  dineroEnCajaEsperado: number;
  desglosePorMetodoPago: {
    metodoPago: string;
    total: number;
    cantidadVentas: number;
  }[];
}

const HistorialVentasModal = ({ vehiculo, onClose }: HistorialVentasModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Historial de Ventas (Viaje Actual)
            </h2>
            <p className="text-sm text-slate-500">{vehiculo.vehiculoNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {vehiculo.historialVentas && vehiculo.historialVentas.length > 0 ? (
            <div className="space-y-4">
              {vehiculo.historialVentas.map((venta) => (
                <div
                  key={venta.ventaId}
                  className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-white">
                      {venta.clienteNombre}
                    </div>
                    <div className="text-xs text-slate-500 flex gap-2 mt-1">
                      <span>{new Date(venta.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{venta.metodoPago}</span>
                      <span>•</span>
                      <span>{venta.cantidadItems} items</span>
                    </div>
                  </div>
                  <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                    ${venta.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              No hay ventas registradas en este recorrido aún.
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const CerrarRepartoModal = ({ vehiculo, onClose, onSuccess }: CerrarRepartoModalProps) => {
  const [kilometraje, setKilometraje] = useState<string>('');
  const [stockItems, setStockItems] = useState<
    {
      productoId: number;
      nombre: string;
      cantidadTeorica: number;
      cantidadFisica: string;
      unitType: UnitType;
      baseUnit: string; // [NEW] Track product's base unit
    }[]
  >([]);
  const [resumenCaja, setResumenCaja] = useState<ResumenCaja | null>(null);
  const [efectivoRendido, setEfectivoRendido] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [fetchingStock, setFetchingStock] = useState(true);

  // [NEW] Helper for conversion
  const getNormalizedFactor = (targetUnit: string, productBaseUnit: string) => {
    const factors: Record<string, number> = {
      'unidad': 1,
      'maple': 30,
      'cajon': 360, // 12 maples * 30 eggs
      'bulto': 30 // Fallback generic bulto
    };

    const target = targetUnit.toLowerCase();
    const base = productBaseUnit.toLowerCase();

    // Special case: If base is Maple, treat 1 Maple as 1 "base unit" (factor 1 relative to itself)
    // But our factors are all relative to UNIT (egg).
    // Factor = TargetFactorInUnits / BaseFactorInUnits

    // Example: Target=Cajon (360), Base=Maple (30). Result = 12.
    // Example: Target=Maple (30), Base=Maple (30). Result = 1.
    // Example: Target=Unit (1), Base=Maple (30). Result = 0.0333.

    const tf = factors[target] || 1;
    const bf = factors[base] || 1;

    return tf / bf;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch detailed stock with IDs
        const stockResponse = await api.get<StockVehiculoItem[]>(
          `/inventario/stock-vehiculo/${vehiculo.vehiculoId}`
        );

        // [FIX] Map properly including base unit check
        const items = stockResponse.data.map((item) => {
          // Default to Maple if it's an egg product or tracked in maples, otherwise Unit
          // We'll trust the database 'unidadDeMedida' if available, else guess.
          // Note: The interface StockVehiculoItem in this file didn't have unity info.
          // We need to extend the backend or cast if the backend sends it (it usually does in 'producto').
          // Let's assume item.producto has 'unidadDeMedida'.
          const p = item.producto as any; // Cast to access extra props if TS complains or extend interface
          const baseUnit = p.unidadDeMedida || 'UNIDAD';

          return {
            productoId: item.productoId,
            nombre: item.producto.nombre,
            cantidadTeorica: item.cantidad,
            cantidadFisica: '',
            unitType: (baseUnit.toLowerCase() === 'maple' || baseUnit.toLowerCase() === 'cajon') ? 'MAPLE' : 'UNIDAD' as UnitType,
            baseUnit: baseUnit
          };
        });
        setStockItems(items);

        // Fetch Cash Summary
        const cajaResponse = await api.get<ResumenCaja>(
          `/inventario/resumen-caja/${vehiculo.vehiculoId}`
        );
        setResumenCaja(cajaResponse.data);
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
        alert('Error al cargar detalle del stock o caja.');
        onClose();
      } finally {
        setFetchingStock(false);
      }
    };
    fetchData();
  }, [vehiculo.vehiculoId, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kilometraje) {
      alert('Por favor ingrese el nuevo kilometraje.');
      return;
    }

    setLoading(true);
    try {
      const currentUserId = 1;

      const payload = {
        vehiculoId: vehiculo.vehiculoId,
        usuarioId: currentUserId,
        nuevoKilometraje: parseFloat(kilometraje),
        stockRetorno: stockItems.map((item) => {
          const qty = parseFloat(item.cantidadFisica) || 0;

          // [FIX] Convert User Input (e.g. Cajon) -> Database Unit (e.g. Maple)
          // QtyEntered * Factor(SelectedUnit -> BaseUnit)
          const conversionFactor = getNormalizedFactor(item.unitType, item.baseUnit);
          const totalInBaseUnits = qty * conversionFactor;

          return {
            productoId: item.productoId,
            cantidadFisica: totalInBaseUnits,
          };
        }),
      };

      await api.post('/inventario/cerrar-reparto', payload);
      alert('Reparto cerrado correctamente.');
      onSuccess();
    } catch (error: any) {
      console.error('Error closing route:', error);
      alert('Error al cerrar reparto: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const newItems = [...stockItems];
    newItems[index].cantidadFisica = value;
    setStockItems(newItems);
  };

  const handleUnitChange = (index: number, value: UnitType) => {
    const newItems = [...stockItems];
    newItems[index].unitType = value;
    setStockItems(newItems);
  };

  const diferenciaCaja = resumenCaja
    ? (parseFloat(efectivoRendido) || 0) - resumenCaja.dineroEnCajaEsperado
    : 0;

  if (fetchingStock)
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg text-center">
          <p>Cargando información del vehículo...</p>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Cerrar Reparto - {vehiculo.vehiculoNombre}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Columna Izquierda: Datos y Stock */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nuevo Kilometraje
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={kilometraje}
                  onChange={(e) => setKilometraje(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder={`Anterior: ${vehiculo.kilometraje} km`}
                  required
                />
                <p className="text-xs text-slate-500 mt-1 ml-1">
                  Anterior: <span className="font-bold">{vehiculo.kilometraje} km</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
                Control de Stock (Retorno)
              </h3>
              <p className="text-sm text-slate-500 mb-4">Verifique el stock físico que regresa.</p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {stockItems.map((item, idx) => {
                  // [FIX] Calculate Theoretical Display
                  // Amount in DB (Base Units) divided by Factor(Selected -> Base)
                  // Actually: AmountDB * (FactorBase / FactorSelected) matches "Convert Base to Selected".
                  // Example: 12 Maples DB. Selected Cajon.
                  // Res = 12 * (30 / 360) = 1. Correct.

                  // Re-using helper logic: 
                  // Factor = getNormalizedFactor(item.unitType, item.baseUnit) returns "How many Base Units in One Selected Unit"
                  // So, QtySelected = QtyBase / Factor.

                  const factorToSelected = getNormalizedFactor(item.unitType, item.baseUnit);
                  const theoreticalQty = item.cantidadTeorica / factorToSelected;

                  return (
                    <div
                      key={item.productoId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg gap-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 dark:text-white">
                          {item.nombre}
                        </div>
                        <div
                          className="text-xs text-slate-500 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1"
                          onClick={() => handleQuantityChange(idx, theoreticalQty.toString())}
                          title="Click para usar este valor"
                        >
                          <span>
                            Teórico:{' '}
                            {theoreticalQty.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </span>
                          <span className="lowercase">
                            {item.unitType === 'CAJON' ? 'cajones' : item.unitType.toLowerCase() + 's'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={item.unitType}
                          onChange={(e) => handleUnitChange(idx, e.target.value as UnitType)}
                          className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="UNIDAD">Unidad</option>
                          <option value="MAPLE">Maple</option>
                          <option value="CAJON">Cajón</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={item.cantidadFisica}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-right outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  );
                })}
                {stockItems.length === 0 && (
                  <p className="text-center text-slate-500 italic">
                    No hay stock registrado en el vehículo.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Control de Caja */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 h-fit">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="p-1 bg-green-100 text-green-600 rounded">$</span>
              Control de Caja
            </h3>

            {resumenCaja ? (
              <div className="space-y-6">
                {/* Resumen General */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 uppercase font-bold">Total Ventas</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white">
                      ${resumenCaja.totalVentas.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 uppercase font-bold">
                      Efectivo Esperado
                    </div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      ${resumenCaja.dineroEnCajaEsperado.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Desglose */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Desglose por Medio de Pago
                  </h4>
                  <div className="space-y-2">
                    {resumenCaja.desglosePorMetodoPago.map((metodo) => (
                      <div
                        key={metodo.metodoPago}
                        className="flex justify-between items-center text-sm p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700"
                      >
                        <span className="text-slate-600 dark:text-slate-400">
                          {metodo.metodoPago} ({metodo.cantidadVentas})
                        </span>
                        <span className="font-medium text-slate-800 dark:text-white">
                          ${metodo.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input Rendición */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Dinero Físico en Caja (Rendido)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={efectivoRendido}
                    onChange={(e) => setEfectivoRendido(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xl font-bold text-right outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="$ 0.00"
                  />

                  {efectivoRendido && (
                    <div
                      className={`mt-3 p-3 rounded-lg flex justify-between items-center ${diferenciaCaja === 0
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : diferenciaCaja > 0
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                    >
                      <span className="font-medium">Diferencia:</span>
                      <span className="font-bold text-lg">
                        {diferenciaCaja > 0 ? '+' : ''}
                        {diferenciaCaja.toLocaleString('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No se pudo cargar el resumen de caja.
              </div>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              'Procesando...'
            ) : (
              <>
                <CheckCircle size={18} />
                Confirmar Cierre
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function StockCallePage() {
  const [data, setData] = useState<StockEnCalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehiculo, setSelectedVehiculo] = useState<StockEnCalle | null>(null);
  const [historialVehiculo, setHistorialVehiculo] = useState<StockEnCalle | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reportes/stock-calle');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching stock en calle:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
            <Truck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Gestión de Viaje</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Estado actual de los vehículos y su mercadería.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((vehiculo) => (
              <div
                key={vehiculo.vehiculoId}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                      {vehiculo.vehiculoNombre}
                    </h3>
                    {vehiculo.choferNombre && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <span className="font-medium">Maneja:</span> {vehiculo.choferNombre}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${vehiculo.enRuta
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                  >
                    {vehiculo.enRuta ? 'En Ruta' : 'En Depósito'}
                  </span>
                </div>

                {/* Last Sale Teaser */}
                {vehiculo.enRuta && vehiculo.ultimaVentaFecha && (
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Última Venta</span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        {new Date(vehiculo.ultimaVentaFecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 dark:text-white truncate">
                      {vehiculo.ultimaVentaCliente}
                    </div>
                    <div className="text-green-600 dark:text-green-400 font-bold">
                      ${vehiculo.ultimaVentaTotal?.toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="flex-1 space-y-3 mb-6">
                  {vehiculo.stock.length > 0 ? (
                    vehiculo.stock.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-700/50 last:border-0 pb-2 last:pb-0"
                      >
                        <span className="text-slate-600 dark:text-slate-300">{item.producto}</span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {item.cantidad}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-sm italic text-center py-4">
                      Sin stock cargado
                    </div>
                  )}
                </div>

                {vehiculo.enRuta && (
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button
                      onClick={() => setHistorialVehiculo(vehiculo)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-sm font-medium"
                    >
                      Ver Historial
                    </button>
                    <button
                      onClick={() => setSelectedVehiculo(vehiculo)}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Cerrar Reparto
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedVehiculo && (
        <CerrarRepartoModal
          vehiculo={selectedVehiculo}
          onClose={() => setSelectedVehiculo(null)}
          onSuccess={() => {
            setSelectedVehiculo(null);
            fetchData();
          }}
        />
      )}

      {historialVehiculo && (
        <HistorialVentasModal
          vehiculo={historialVehiculo}
          onClose={() => setHistorialVehiculo(null)}
        />
      )}
    </div>
  );
}
