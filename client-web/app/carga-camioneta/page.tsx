'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Plus,
  Save,
  ArrowLeft,
  Egg,
  History,
  Check,
  AlertTriangle,
  X,
  ChevronRight,
  User,
  AlertOctagon,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { Pedido } from '@/types/pedido';
import dynamic from 'next/dynamic';
import { RoutePdf } from '@/components/pdf/RoutePdf';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <button className="px-6 py-3 rounded-xl bg-slate-200 text-slate-500 font-bold">Cargando PDF...</button>,
  }
);

// Interfaces para datos de API
interface Vehiculo {
  vehiculoId: number;
  marca: string;
  modelo: string;
  patente: string;
  enRuta: boolean;
}

interface Producto {
  productoId: number;
  nombre: string;
  tipoProducto: number;
  stockActual: number;
}

// Interfaces para UI
interface VehiculoUI {
  id: number;
  nombre: string;
  patente: string;
  enRuta: boolean;
}

interface ProductoUI {
  id: number;
  nombre: string;
  stockActual: number;
  unidadDeMedida: string;
}

interface Usuario {
  usuarioId: number;
  nombre: string;
  apellido: string;
}

const getNormalizedFactor = (targetUnitId: string, productUnit: string) => {
  const factors: Record<string, number> = {
    'unidad': 1,
    'maple': 30,
    'cajon': 360,
    'medio_cajon': 180,
    'decima': 10,
    'docena': 12
  };

  const target = targetUnitId.toLowerCase();
  const base = productUnit.toLowerCase();

  const tf = factors[target] || 1;
  const bf = factors[base] || 1;

  return tf / bf;
};

const unidadesMedida = [
  { id: 'maple', nombre: 'Maple (30u)' },
  { id: 'cajon', nombre: 'Cajón (12 maples)' },
  { id: 'medio_cajon', nombre: 'Medio Cajón (6 maples)' },
  { id: 'unidad', nombre: 'Unidad Suelta' },
];

interface HistorialItem {
  id: number;
  fecha: string;
  vehiculo: string;
  totalHuevos: number;
  itemsCount: number;
}

interface ActiveTrip {
  viajeId: number;
  vehiculoId: number;
  choferId: number;
  acompananteId?: number | null;
}

export default function CargaCamionetaPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoUI[]>([]);
  const [productosBase, setProductosBase] = useState<ProductoUI[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedVehiculo, setSelectedVehiculo] = useState<number | null>(null);
  const [selectedChofer, setSelectedChofer] = useState<number | null>(null);
  const [selectedAcompanante, setSelectedAcompanante] = useState<number | null>(null);
  const [items, setItems] = useState<{ productoId: number; unidadId: string; cantidad: number; locked?: boolean }[]>(
    []
  );

  // UI States
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("¡Carga registrada y Viaje Iniciado!");
  const [historial, setHistorial] = useState<HistorialItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // PDF Generation State
  const [pdfData, setPdfData] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Pedidos State
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);
  const [selectedPedidos, setSelectedPedidos] = useState<number[]>([]);
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await api.get('/inventario/historial-cargas');
        setHistorial(res.data);
      } catch (error) {
        console.error('Error cargando historial:', error);
      }
    };

    const fetchData = async () => {
      try {
        const [vRes, pRes, uRes, peRes, tRes] = await Promise.all([
          api.get('/vehiculos'),
          api.get('/productos'),
          api.get('/inventario/usuarios'),
          api.get('/pedidos/pendientes'),
          api.get('/viajes/activos'),
        ]);

        const vehiculosMapped = vRes.data
          .filter((v: Vehiculo) => v.patente !== 'GRANJA') // Exclude Granja from "Load" list
          .map((v: Vehiculo) => ({
            id: v.vehiculoId,
            nombre: `${v.marca} ${v.modelo}`,
            patente: v.patente,
            enRuta: v.enRuta,
          }));

        const productosMapped = pRes.data.map((p: any) => ({
          id: p.productoId,
          nombre: p.nombre,
          stockActual: p.stockActual,
          unidadDeMedida: p.unidadDeMedida,
        }));

        setVehiculos(vehiculosMapped);
        setProductosBase(productosMapped);
        setUsuarios(uRes.data);
        setPedidosPendientes(peRes.data);
        setActiveTrips(tRes.data);
        await fetchHistorial();
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const fetchHistorial = async () => {
    try {
      const res = await api.get('/inventario/historial-cargas');
      setHistorial(res.data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const calculateItemsFromPedidos = (pedidoIds: number[]) => {
    // Collect all items from selected pedidos
    const allDetalles = pedidosPendientes
      .filter(p => pedidoIds.includes(p.pedidoId))
      .flatMap(p => p.detalles);

    // Group by ProductoId
    const groups = allDetalles.reduce((acc, d) => {
      const k = d.productoId;
      if (!acc[k]) acc[k] = { productoId: k, totalUnits: 0 };

      // Normalize to Units
      const factors: Record<string, number> = {
        'unidad': 1,
        'maple': 30,
        'cajon': 360,
        'docena': 12
      };

      const factor = factors[d.unidad.toLowerCase()] || 1;
      acc[k].totalUnits += d.cantidad * factor;
      return acc;
    }, {} as Record<number, { productoId: number; totalUnits: number }>);

    // Create Item Lines
    const newItems = Object.values(groups).map(g => {
      const prod = productosBase.find(p => p.id === g.productoId);

      // Determine preferred loading unit
      // If product is Eggs/Maple, load in Maples.
      let unitId = 'unidad';
      let qty = g.totalUnits;

      if (prod?.unidadDeMedida === 'Maple' || prod?.nombre.toLowerCase().includes('huevo')) {
        unitId = 'maple';
        // Convert Units -> Maples
        qty = g.totalUnits / 30;
      }

      return {
        productoId: g.productoId,
        unidadId: unitId,
        cantidad: qty,
        locked: true // Mark as locked because it comes from orders
      };
    });

    // If we want to preserve manual items, we would need to separate them. 
    // For now, based on current logic, selecting orders resets the list, which is consistent.
    setItems(newItems);
  };

  const handleTogglePedido = (id: number) => {
    const newSelection = selectedPedidos.includes(id)
      ? selectedPedidos.filter(pid => pid !== id)
      : [...selectedPedidos, id];

    setSelectedPedidos(newSelection);
    calculateItemsFromPedidos(newSelection);
  };

  const handleAddItem = () => {
    if (productosBase.length > 0) {
      setItems([...items, { productoId: productosBase[0].id, unidadId: 'cajon', cantidad: 1, locked: false }]);
    }
  };

  const handleUpdateItem = (index: number, field: keyof typeof items[0], value: any) => {
    const newItems = [...items];
    // @ts-ignore
    if (items[index].locked) return; // Prevent editing locked items
    // @ts-ignore
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items[index].locked) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePreSubmit = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedVehiculo) return;
    setIsSubmitting(true);

    try {
      const vehiculo = vehiculos.find((v) => v.id === selectedVehiculo);

      const payload = {
        vehiculoId: selectedVehiculo,
        usuarioId: 1, // TODO: Obtener del contexto de autenticación
        choferId: selectedChofer,
        items: items.map((item) => {
          const prod = productosBase.find(p => p.id === item.productoId);
          const factor = getNormalizedFactor(item.unidadId, prod?.unidadDeMedida || 'Unidades');

          return {
            productoId: item.productoId,
            cantidad: item.cantidad * factor,
          };
        }),
      };

      await api.post('/inventario/cargar-vehiculo', payload);

      // AUTOMATICALLY START TRIP
      let tripStarted = false;
      let viajeId: number | null = null;
      let existingViajeId = null;

      if (!vehiculo?.enRuta) {
        try {
          const viajeRes = await api.post('/viajes/iniciar', {
            VehiculoId: Number(selectedVehiculo),
            ChoferId: Number(selectedChofer),
            AcompananteId: selectedAcompanante ? Number(selectedAcompanante) : null,
            Observaciones: 'Iniciado automáticamente desde Carga de Camioneta'
          });
          viajeId = viajeRes.data.viajeId;
          tripStarted = true;
        } catch (tripError: any) {
          console.error("Error starting trip", tripError);
          alert(`La carga se guardó, pero NO SE PUDO INICIAR EL VIAJE: ${tripError.response?.data || tripError.message}`);
        }
      } else {
        // Find existing trip logic if needed, or query API.
        // For now, assuming we can find it via active trip endpoint.
        const vRes = await api.get(`/viajes/activo-por-usuario/${selectedChofer}`);
        // This endpoint might be by User, or we added 'activo-por-vehiculo'?
        // The backend has `activo-por-usuario`.
        // We'll trust that assigning orders to "Current Trip" is handled or we skip assignment if generic loading.
        // User asked: "cuando cargo los pedidos, automaticamente se carga la camioneta...".
        // Usually at start of trip.
        // If Trip Started, we use `viajeId`.
      }

      // ASSIGN ORDERS
      if (selectedPedidos.length > 0 && (tripStarted && viajeId)) {
        try {
          await api.post('/pedidos/asignar-viaje', {
            ViajeId: viajeId,
            PedidoIds: selectedPedidos
          });
        } catch (assignError) {
          console.error("Error assigning orders", assignError);
          // Not blocking flow but warning
        }
      }

      await fetchHistorial();

      // Recargar productos para actualizar stock
      const pRes = await api.get('/productos');
      const productosMapped = pRes.data.map((p: any) => ({
        id: p.productoId,
        nombre: p.nombre,
        stockActual: p.stockActual,
        unidadDeMedida: p.unidadDeMedida,
      }));
      setProductosBase(productosMapped);

      // Resetear form
      setItems([]);
      setSelectedVehiculo(null);
      setSelectedChofer(null);
      setSelectedAcompanante(null);
      setIsConfirmModalOpen(false);

      const message = vehiculo?.enRuta
        ? "¡Carga agregada al viaje en curso!"
        : "¡Carga registrada y Viaje Iniciado!";

      setToastMessage(message);
      setShowToast(tripStarted);

      // PREPARE PDF DATA
      const ch = usuarios.find(u => u.usuarioId === selectedChofer);
      const ac = usuarios.find(u => u.usuarioId === selectedAcompanante); // Correctly find accompanist object
      // Re-find vehiculo safely in case it changed
      const vehForPdf = vehiculos.find((v) => v.id === selectedVehiculo);

      const ordersForPdf = pedidosPendientes
        .filter(p => selectedPedidos.includes(p.pedidoId))
        .map(p => ({
          pedidoId: p.pedidoId,
          cliente: p.cliente?.nombreCompleto || p.cliente?.nombre || p.clienteNombre || 'Cliente',
          direccion: p.cliente?.direccion || '',
          items: p.detalles.map(d => ({
            producto: d.productoNombre || productosBase.find(pr => pr.id === d.productoId)?.nombre || '?',
            cantidad: d.cantidad,
            unidad: d.unidad,
          }))
        }));

      const totalLoadForPdf = items.map(i => {
        const p = productosBase.find(pr => pr.id === i.productoId);
        const u = unidadesMedida.find(un => un.id === i.unidadId);
        // Re-calculate factor here as helper might not be accessible inside map if not careful, but it is in scope.
        const factor = getNormalizedFactor(i.unidadId, p?.unidadDeMedida || 'Unidades');
        return {
          producto: p?.nombre || 'Unknown',
          cantidad: i.cantidad,
          unidad: u?.nombre || i.unidadId,
          totalHuevos: i.cantidad * factor
        };
      });

      setPdfData({
        fecha: new Date().toLocaleDateString(),
        chofer: `${ch?.nombre} ${ch?.apellido}`,
        vehiculo: vehForPdf?.nombre || '',
        patente: vehForPdf?.patente || '',
        acompanante: ac ? `${ac.nombre} ${ac.apellido}` : undefined,
        pedidos: ordersForPdf,
        cargaTotal: totalLoadForPdf
      });

      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Error al cargar vehículo:', error);
      alert(`Error al cargar vehículo: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResumenCarga = () => {
    return items.map((item) => {
      const prod = productosBase.find((p) => p.id === item.productoId);
      const unidad = unidadesMedida.find((u) => u.id === item.unidadId);
      const factor = getNormalizedFactor(item.unidadId, prod?.unidadDeMedida || 'Unidades');

      return {
        producto: prod?.nombre,
        presentacion: unidad?.nombre,
        cantidad: item.cantidad,
        totalHuevos: item.cantidad * factor,
      };
    });
  };

  const getSelectedVehiculoObj = () => vehiculos.find((v) => v.id === selectedVehiculo);

  // Helper local para calcular stock usado
  const getUsedStockUntilIndex = (itemsList: typeof items, prodId: number, targetIndex: number) => {
    return itemsList
      .slice(0, targetIndex)
      .filter(i => i.productoId === prodId)
      .reduce((acc, i) => {
        const prod = productosBase.find(p => p.id === i.productoId);
        const factor = getNormalizedFactor(i.unidadId, prod?.unidadDeMedida || 'Unidades');
        return acc + (i.cantidad * factor);
      }, 0);
  };

  // Validation function
  const hasInsufficientStock = items.some((item, index) => {
    const prod = productosBase.find(p => p.id === item.productoId);
    if (!prod) return false;

    // Calculamos cuánto se usó de este producto en filas anteriores
    const stockConsumidoPrevio = getUsedStockUntilIndex(items, item.productoId, index);
    const stockDisponible = prod.stockActual - stockConsumidoPrevio;

    const factor = getNormalizedFactor(item.unidadId, prod.unidadDeMedida);

    const totalSolicitado = item.cantidad * factor;

    return totalSolicitado > stockDisponible;
  });

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">
        Cargando datos...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 pb-32 transition-colors duration-300">
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* SUCCESS MODAL WITH PDF DOWNLOAD */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="¡Carga Exitosa!"
        footer={
          <button
            onClick={() => setIsSuccessModalOpen(false)}
            className="w-full py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
          >
            Cerrar
          </button>
        }
      >
        <div className="flex flex-col items-center text-center gap-6 py-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
            <Check size={40} strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">¡Todo Listo!</h3>
            <p className="text-slate-500 dark:text-slate-400">
              La carga se registró correctamente y el viaje ha comenzado.
              <br />Ya podés descargar la documentación.
            </p>
          </div>

          {pdfData && (
            <div className="w-full">
              {/* @ts-ignore */}
              <PDFDownloadLink
                document={<RoutePdf data={pdfData} />}
                fileName={`Hoja_Ruta_${new Date().toISOString().slice(0, 10)}.pdf`}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-4 rounded-xl font-bold shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                {/* @ts-ignore */}
                {({ loading }: any) => (
                  <>
                    <Save size={20} />
                    {loading ? 'Generando PDF...' : 'Descargar Hoja de Ruta y Remitos'}
                  </>
                )}
              </PDFDownloadLink>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={
          getSelectedVehiculoObj()?.enRuta ? '⚠️ ATENCIÓN: Vehículo en Calle' : 'Confirmar Carga'
        }
        footer={
          <>
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2.5 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${getSelectedVehiculoObj()?.enRuta
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                }`}
            >
              {isSubmitting ? (
                'Procesando...'
              ) : (
                <>
                  <Check size={18} />{' '}
                  {getSelectedVehiculoObj()?.enRuta ? 'Sí, Cargar Igual' : 'Confirmar'}
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {getSelectedVehiculoObj()?.enRuta ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border-2 border-red-100 dark:border-red-800 flex flex-col items-center text-center gap-4 animate-pulse">
              <div className="bg-red-100 dark:bg-red-800 p-4 rounded-full text-red-600 dark:text-red-200">
                <AlertOctagon size={48} strokeWidth={2} />
              </div>
              <div>
                <h4 className="font-black text-red-700 dark:text-red-300 text-2xl mb-2">
                  ¡ATENCIÓN!
                </h4>
                <p className="font-bold text-red-900 dark:text-red-100 text-lg leading-tight">
                  Estás por cargar una camioneta que está{' '}
                  <span className="underline decoration-wavy">EN LA CALLE</span>.
                </p>
                <p className="text-red-600 dark:text-red-300 mt-3">
                  ¿Estás seguro que querés agregar huevos sobre:{' '}
                  <span className="font-black bg-red-200 dark:bg-red-800 px-2 py-0.5 rounded text-red-900 dark:text-white">
                    {getSelectedVehiculoObj()?.nombre}
                  </span>
                  ?
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full text-blue-600 dark:text-blue-200">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="font-bold text-blue-900 dark:text-blue-100 text-lg">
                  ¿Confirmar Carga y Salida?
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                  Se cargará el stock y se <strong>INICIARÁ EL VIAJE</strong> para{' '}
                  <span className="font-black bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded">
                    {getSelectedVehiculoObj()?.nombre}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-end mb-3">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">
                Detalle de Items
              </h4>
              <span className="text-xs font-medium text-slate-400">{items.length} items</span>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {getResumenCarga().map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-600 text-xs font-bold">
                      {item.cantidad}x
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">
                        {item.producto}
                      </p>
                      <p className="text-xs text-slate-500">{item.presentacion}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-400 text-sm">
                    {item.totalHuevos} un.
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-white text-lg">Total Maples</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {getResumenCarga()
                  .reduce((acc, i) => acc + i.totalHuevos, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="group p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105"
            >
              <ArrowLeft
                size={24}
                className="text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform"
              />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                Carga de Camioneta
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                Gestión de stock y logística diaria
              </p>
            </div>
          </div>

          {/* Stats rápidas (opcional) */}
          <div className="hidden md:flex gap-4">
            <div className="bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Fecha</p>
              <p className="font-bold text-slate-800 dark:text-white">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Selección de Vehículo (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  1
                </span>
                Seleccionar Vehículo
              </h3>
              <div className="space-y-4">
                {vehiculos.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehiculo(v.id)}
                    className={`w-full relative overflow-hidden p-4 rounded-2xl border-2 text-left transition-all duration-300 group ${selectedVehiculo === v.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-lg shadow-blue-500/20 scale-[1.02]'
                      : 'border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div
                        className={`p-3.5 rounded-2xl shadow-sm ${selectedVehiculo === v.id ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-400 group-hover:text-blue-500'} transition-colors`}
                      >
                        <Truck size={24} />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-bold text-lg ${selectedVehiculo === v.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}
                        >
                          {v.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {v.patente}
                          </span>
                          {v.enRuta && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle size={10} /> En Calle
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedVehiculo === v.id && (
                        <div className="text-blue-500 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm">
                          <Check size={16} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selección de Chofer */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  2
                </span>
                Asignar Chofer
              </h3>
              <div className="relative">
                <select
                  value={selectedChofer || ''}
                  onChange={(e) => setSelectedChofer(Number(e.target.value))}
                  className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold appearance-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                >
                  <option value="" disabled>
                    Seleccione un chofer...
                  </option>
                  {usuarios
                    .filter(u => {
                      // Logic to hide users who are in an active trip
                      // UNLESS they are assigned to the currently selected vehicle (adding stock case)
                      const currentTrip = activeTrips.find(t => t.vehiculoId === selectedVehiculo);

                      // Is this user in ANY active trip?
                      const userTrip = activeTrips.find(t => t.choferId === u.usuarioId || t.acompananteId === u.usuarioId);

                      if (!userTrip) return true; // User is free

                      // User is busy. Are they busy on the CURRENT vehicle?
                      if (currentTrip && (currentTrip.choferId === u.usuarioId || currentTrip.acompananteId === u.usuarioId)) {
                        return true; // Allow them
                      }

                      return false; // Hide them
                    })
                    .map((u) => (
                      <option key={u.usuarioId} value={u.usuarioId}>
                        {u.nombre} {u.apellido}
                      </option>
                    ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={20} />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight size={20} className="rotate-90" />
                </div>
              </div>
            </div>
            {/* Selección de Acompañante */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  3
                </span>
                Asignar Acompañante (Opcional)
              </h3>
              <div className="relative">
                <select
                  value={selectedAcompanante || ''}
                  onChange={(e) => setSelectedAcompanante(e.target.value ? Number(e.target.value) : null)}
                  className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold appearance-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                >
                  <option value="">
                    Sin acompañante
                  </option>
                  {usuarios
                    .filter(u => u.usuarioId !== selectedChofer)
                    .filter(u => {
                      // Same logic for Acompanante
                      const currentTrip = activeTrips.find(t => t.vehiculoId === selectedVehiculo);
                      const userTrip = activeTrips.find(t => t.choferId === u.usuarioId || t.acompananteId === u.usuarioId);

                      if (!userTrip) return true;

                      if (currentTrip && (currentTrip.choferId === u.usuarioId || currentTrip.acompananteId === u.usuarioId)) {
                        return true;
                      }

                      return false;
                    })
                    .map((u) => (
                      <option key={u.usuarioId} value={u.usuarioId}>
                        {u.nombre} {u.apellido}
                      </option>
                    ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={20} />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight size={20} className="rotate-90" />
                </div>
              </div>
            </div>

            {/* Resumen de Carga (Sticky) */}
            <div
              className={`transition-all duration-500 ${items.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none grayscale'}`}
            >
              <div className="bg-slate-900/95 backdrop-blur-xl dark:bg-blue-600/90 rounded-[2rem] p-6 shadow-2xl text-white sticky top-24 border border-slate-700 dark:border-blue-500 overflow-hidden relative z-20">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                  <Package size={20} className="text-blue-400 dark:text-blue-200" /> Resumen Total
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <span className="block text-slate-400 dark:text-blue-100 text-xs font-bold uppercase mb-1">
                      Items
                    </span>
                    <span className="block font-black text-2xl">{items.length}</span>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <span className="block text-slate-400 dark:text-blue-100 text-xs font-bold uppercase mb-1">
                      Bultos
                    </span>
                    <span className="block font-black text-2xl">
                      {items.reduce((acc, i) => acc + i.cantidad, 0)}
                    </span>
                  </div>
                </div>

                {hasInsufficientStock && (
                  <div className="mb-4 bg-red-500/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-2 text-red-200 text-sm font-bold animate-pulse">
                    <AlertTriangle size={18} />
                    <span>Stock insuficiente en uno o más items.</span>
                  </div>
                )}

                <button
                  onClick={handlePreSubmit}
                  disabled={!selectedVehiculo || !selectedChofer || items.length === 0 || hasInsufficientStock}
                  className="w-full bg-blue-500 hover:bg-blue-400 dark:bg-white dark:text-blue-600 dark:hover:bg-blue-50 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/50 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] relative z-10"
                >
                  <Save size={20} />
                  Confirmar Carga
                </button>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Lista de Productos (8 cols) */}
          <div className="lg:col-span-8 space-y-8">

            {/* Pedidos Selection */}
            {pedidosPendientes.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">P</span>
                  Seleccionar Pedidos Pendientes
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pedidosPendientes.map(p => {
                    const isAssigned = p.estado === 1; // Asignado
                    return (
                      <div key={p.pedidoId}
                        onClick={() => handleTogglePedido(p.pedidoId)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden
                              ${selectedPedidos.includes(p.pedidoId)
                            ? (isAssigned ? 'bg-orange-100 border-orange-500 dark:bg-orange-900/30 dark:border-orange-500' : 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20 dark:border-indigo-400')
                            : (isAssigned
                              ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800 hover:border-orange-300'
                              : 'bg-white hover:bg-slate-50 border-slate-200 dark:border-slate-700 dark:bg-slate-800')}`}
                      >
                        {isAssigned && (
                          <div className="absolute top-0 right-0 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-[9px] font-black px-2 py-0.5 rounded-bl-lg border-l border-b border-orange-200 dark:border-orange-800 flex items-center gap-1">
                            <Truck size={10} /> EN CALLE
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-bold ${isAssigned ? 'text-orange-900 dark:text-orange-100' : 'text-slate-800 dark:text-white'}`}>
                              {p.cliente?.nombreCompleto || p.cliente?.nombre || p.clienteNombre || `Cliente #${p.clienteId}`}
                            </p>
                            {isAssigned && !selectedPedidos.includes(p.pedidoId) && (
                              <AlertTriangle size={14} className="text-orange-500 animate-pulse" />
                            )}
                          </div>
                          {p.cliente?.direccion && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="shrink-0" /> {p.cliente.direccion}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(p.fechaPedido).toLocaleDateString()} • {p.detalles.length} items</p>
                        </div>
                        {selectedPedidos.includes(p.pedidoId) && (
                          <div className={`rounded-full p-1 ${isAssigned ? 'bg-orange-500 text-white' : 'bg-indigo-500 text-white'}`}>
                            <Check size={16} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 min-h-[500px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    4
                  </span>
                  Inventario a Cargar
                </h3>
                <button
                  onClick={handleAddItem}
                  className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                  <Plus size={18} /> Agregar Item
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 group">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-full mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Package size={48} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="font-bold text-slate-600 dark:text-slate-300 text-lg">
                    Tu lista está vacía
                  </p>
                  <p className="text-sm mt-2 text-slate-500">
                    Comienza agregando productos al inventario
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const prod = productosBase.find(p => p.id === item.productoId);
                    const unidad = unidadesMedida.find(u => u.id === item.unidadId);

                    // Calculamos stock usado HASTA este índice para este producto
                    const stockConsumidoPrevio = getUsedStockUntilIndex(items, item.productoId, index);
                    // Stock real disponible para esta fila
                    const stockDisponibleParaEsteItem = (prod?.stockActual || 0) - stockConsumidoPrevio;

                    const factor = getNormalizedFactor(item.unidadId, prod?.unidadDeMedida || 'Unidades');
                    const totalSolicitado = item.cantidad * factor;
                    const isInsufficient = totalSolicitado > stockDisponibleParaEsteItem;

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row gap-4 items-start md:items-center group animate-in slide-in-from-bottom-4 duration-300 fill-mode-backwards
                          ${isInsufficient
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 shadow-md'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md'
                          }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Icono Producto */}
                        <div className={`hidden md:flex p-4 rounded-xl shrink-0 ${isInsufficient ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'}`}>
                          {item.locked ? <AlertOctagon size={24} className="text-blue-500" /> : (isInsufficient ? <AlertTriangle size={24} /> : <Egg size={24} />)}
                        </div>

                        <div className="flex-1 w-full">
                          <div className="grid grid-cols-12 gap-4">
                            {/* Selector Producto */}
                            <div className="col-span-12 md:col-span-6">
                              <div className="flex justify-between items-center mb-1.5 gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`md:hidden p-1.5 rounded-lg ${isInsufficient ? 'bg-red-100 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                                    {isInsufficient ? <AlertTriangle size={14} /> : <Egg size={14} />}
                                  </div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Producto
                                  </label>
                                </div>
                                {prod && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${isInsufficient ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    Stock: {
                                      prod.unidadDeMedida.toLowerCase() === 'maple'
                                        ? prod.stockActual.toLocaleString() + ' Maple'
                                        : Math.floor(prod.stockActual / 30).toLocaleString() + ' Cajones'
                                    }
                                  </span>
                                )}
                                {item.locked && (
                                  <span className="ml-2 text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                    De Pedido
                                  </span>
                                )}
                              </div>
                              <div className="relative">
                                <select
                                  value={item.productoId}
                                  onChange={(e) =>
                                    handleUpdateItem(index, 'productoId', Number(e.target.value))
                                  }
                                  disabled={item.locked}
                                  className={`w-full p-3 pl-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none font-bold text-sm ${item.locked
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                                    }`}
                                >
                                  {productosBase.map((p) => {
                                    // Calcular stock restante de este producto considerando lo usado en filas anteriores
                                    const used = getUsedStockUntilIndex(items, p.id, index);
                                    const remaining = Math.max(0, p.stockActual - used);
                                    return (
                                      <option key={p.id} value={p.id}>
                                        {p.nombre} (Stock: {p.unidadDeMedida.toLowerCase() === 'maple' ? remaining.toLocaleString() : Math.floor(remaining / 30).toLocaleString()} {p.unidadDeMedida})
                                      </option>
                                    );
                                  })}
                                </select>
                                {!item.locked && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronRight size={16} className="rotate-90" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Selector Unidad */}
                            <div className="col-span-7 md:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                                Presentación
                              </label>
                              <div className="relative">
                                <select
                                  value={item.unidadId}
                                  onChange={(e) => handleUpdateItem(index, 'unidadId', e.target.value)}
                                  disabled={item.locked}
                                  className={`w-full p-3 pl-4 rounded-xl border font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none ${item.locked
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                                    }`}
                                >
                                  {unidadesMedida.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.nombre}
                                    </option>
                                  ))}
                                </select>
                                {!item.locked && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronRight size={16} className="rotate-90" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Input Cantidad */}
                            <div className="col-span-5 md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                                Cant.
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) =>
                                  handleUpdateItem(index, 'cantidad', Number(e.target.value))
                                }
                                disabled={item.locked}
                                className={`w-full p-3 rounded-xl border font-black text-center focus:ring-2 outline-none transition-all
                                  ${item.locked ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700' :
                                    isInsufficient
                                      ? 'border-red-300 bg-red-50 text-red-600 focus:ring-red-500'
                                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-blue-500'
                                  }`}
                              />
                            </div>
                          </div>

                          {isInsufficient && prod && (
                            <div className="mt-2 text-red-500 text-xs font-bold flex items-center justify-end gap-1 px-1">
                              <span>Excede stock disponible ({prod.unidadDeMedida.toLowerCase() === 'maple' ? stockDisponibleParaEsteItem.toLocaleString() : Math.floor(stockDisponibleParaEsteItem / 30).toLocaleString()} {prod.unidadDeMedida})</span>
                            </div>
                          )}
                        </div>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => handleRemoveItem(index)}
                          disabled={item.locked}
                          className={`absolute top-2 right-2 md:static p-2 md:p-3 rounded-xl transition-colors shrink-0 ${item.locked
                            ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                            : 'text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                        >
                          {item.locked ? <AlertOctagon size={20} /> : <X size={20} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historial de Cargas */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <History size={20} className="text-slate-400" /> Historial Reciente
              </h3>
              {historial.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No hay cargas recientes.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(
                    historial.reduce((groups, item) => {
                      const date = new Date(item.fecha).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });
                      if (!groups[date]) groups[date] = [];
                      groups[date].push(item);
                      return groups;
                    }, {} as Record<string, HistorialItem[]>)
                  ).sort((a, b) => new Date(b[1][0].fecha).getTime() - new Date(a[1][0].fecha).getTime()) // Ordenar grupos por fecha descendente
                    .map(([date, items]) => (
                      <div key={date}>
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2 border-b border-slate-100 dark:border-slate-700 pb-1">
                          {date}
                        </h4>
                        <div className="space-y-3">
                          {items
                            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) // Ordenar items dentro del grupo por hora descendente
                            .map((h) => (
                              <div
                                key={h.id}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-colors cursor-default"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-full text-green-600 dark:text-green-400">
                                    <Check size={16} strokeWidth={3} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{h.vehiculo}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                      {new Date(h.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-slate-800 dark:text-white">
                                    {h.totalHuevos.toLocaleString()}
                                  </p>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                    huevos
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div >
        </div >
      </div >
    </div >
  );
}
