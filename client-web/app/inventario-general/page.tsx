'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Package, Save, ArrowLeft, Calculator, DollarSign } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface Producto {
  productoId: number;
  nombre: string;
  stockActual: number;
  unidadDeMedida: string; // [NEW] Needed for conversion
}

type UnitType = 'UNIDAD' | 'MAPLE' | 'CAJON';

const UNIT_FACTORS: Record<UnitType, number> = {
  UNIDAD: 1,
  MAPLE: 30,
  CAJON: 360, // 12 Maples * 30 Eggs
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

export default function InventarioGeneralPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productoId: '',
    cantidad: '',
    unitType: 'CAJON' as UnitType,

    precio: '', // Precio TOTAL por la unidad seleccionada (Cajon/Maple/etc)
    margin: '30', // Default 30% margin
    precioMin: '',
    precioMax: '',
    proveedor: '',
    observaciones: '',
  });

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await api.get('/productos');
        // Ensure mapping includes new field
        const mapped = response.data.map((p: any) => ({
          productoId: p.productoId,
          nombre: p.nombre,
          stockActual: p.stockActual,
          unidadDeMedida: p.unidadDeMedida || 'UNIDAD'
        }));
        setProductos(mapped);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  const calculateTotals = () => {
    const qty = parseFloat(formData.cantidad) || 0;
    const price = parseFloat(formData.precio) || 0; // This is unit price of the selected UnitType (e.g. Price per Cajon)
    const factor = UNIT_FACTORS[formData.unitType];

    const totalUnits = qty * factor; // Total Eggs
    const unitCost = totalUnits > 0 ? price / factor : 0; // Cost per Egg
    const totalCost = qty * price;

    return { totalUnits, unitCost, totalCost };
  };

  // Effect to recalculate suggested prices when Cost or Margin changes
  useEffect(() => {
    if (!formData.productoId || !formData.precio || !formData.cantidad) return;

    const { unitCost } = calculateTotals(); // Cost per individual egg
    // We usually sell by Maple or Dozen, or Unit?
    // Prices in system are usually stored per "Unidad".
    // But user might want to see suggested price per MAPLE or CAJON?
    // Let's stick to Base Unit of Product (usually Unit or Maple).
    // Wait, Product.UnidadDeMedida usually is MAPLE for eggs? Or UNIDAD?
    // Let's assume we store prices per "Unidad" (1 egg) in backend for consistency, 
    // BUT if the product is "Maple", price is per Maple.
    // Let's check: Product model has 'UnidadDeMedida'.
    // If we are selling eggs, we usually talk about Price per Maple.

    // Let's calculate the Cost per Base Unit of the selected product.
    const selectedProd = productos.find(p => p.productoId.toString() === formData.productoId);
    if (!selectedProd) return;

    // Calculate Cost Per Base Unit (e.g. Cost per Maple)
    // 1. Get Cost Per Egg (unitCost)
    // 2. Multiply by factor of Base Unit.
    // If prod.unidadDeMedida is 'MAPLE', factor is 30.
    const productFactor = UNIT_FACTORS[(selectedProd.unidadDeMedida.toUpperCase() as UnitType)] || 1;

    // Cost per Base Unit (The unit the product is tracked in)
    const costPerBaseParam = unitCost * productFactor;

    const margin = parseFloat(formData.margin) || 0;
    const minPrice = costPerBaseParam * (1 + margin / 100);
    const maxPrice = minPrice * 1.25; // Default spread

    setFormData(prev => ({
      ...prev,
      precioMin: minPrice.toFixed(2),
      precioMax: maxPrice.toFixed(2)
    }));

  }, [formData.precio, formData.cantidad, formData.unitType, formData.margin, formData.productoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { totalUnits, totalCost } = calculateTotals();
    const selectedProd = productos.find(p => p.productoId.toString() === formData.productoId);

    try {
      if (!selectedProd) throw new Error("Producto no seleccionado");

      // Normalize to Product Base Unit
      // Example: Buying 1 Cajon (360 eggs). Product is Maple (30).
      // Factor (Cajon -> Maple) = 360 / 30 = 12.
      const factorToBase = getNormalizedFactor(formData.unitType, selectedProd.unidadDeMedida);

      const qtyEntered = parseFloat(formData.cantidad);
      const qtyNormalized = qtyEntered * factorToBase; // 1 * 12 = 12 Maples.

      const costPerBaseUnit = totalCost / qtyNormalized; // 36000 / 12 = 3000 per Maple.

      const payload = {
        usuarioId: 1,
        proveedor: formData.proveedor,
        observaciones: `[${formData.cantidad} ${formData.unitType}] ${formData.observaciones}`,
        items: [
          {
            productoId: parseInt(formData.productoId),
            cantidad: qtyNormalized,
            costoUnitario: costPerBaseUnit,
            margenGanancia: parseFloat(formData.margin) || 0,
            precioMinimoNuevo: parseFloat(formData.precioMin) || 0,
            precioMaximoNuevo: parseFloat(formData.precioMax) || 0
          },
        ],
      };

      await api.post('/inventario/compra', payload);
      alert('Compra registrada exitosamente');
      router.push('/');
    } catch (error: any) {
      console.error('Error registering purchase:', error);
      const msg = error.response?.data?.message || 'Error al registrar la compra';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const { totalUnits, unitCost, totalCost } = calculateTotals();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Volver al Panel de Control
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <Package size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                Cargar Inventario General
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Registrar compra de mercadería (Huevos) para el depósito central.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Producto Selection */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Huevo (Producto)
                </label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.productoId}
                  onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
                >
                  <option value="">Seleccione un producto...</option>
                  {productos.map((p) => (
                    <option key={p.productoId} value={p.productoId}>
                      {p.nombre} (Stock actual: {p.stockActual})
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Type Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Cantidad
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UNIDAD', 'MAPLE', 'CAJON'] as UnitType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, unitType: type })}
                      className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${formData.unitType === type
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Cantidad ({formData.unitType})
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  placeholder={`Ej: 5 ${formData.unitType.toLowerCase()}s`}
                />
              </div>

              {/* Price Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Precio por {formData.unitType}
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Proveedor Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Proveedor
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  placeholder="Nombre del proveedor"
                />
              </div>
            </div>



            {/* Margin & Pricing Section */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-6">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                <Calculator size={18} /> Configuración de Precios (Sugeridos)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Margin Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Margen Ganancia (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-200"
                    value={formData.margin}
                    onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                  />
                </div>
                {/* Min Price Auto */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Precio Minimo (Sugerido)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      readOnly
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 border-none text-slate-600 dark:text-slate-300 font-bold outline-none cursor-not-allowed"
                      value={formData.precioMin}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 pl-1">Base + Margen ({formData.margin}%)</p>
                </div>
                {/* Max Price Editable */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Precio Máximo (Techo)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                      value={formData.precioMax}
                      onChange={(e) => setFormData({ ...formData, precioMax: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Calculator size={20} className="text-blue-500" />
                Resumen de Compra
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">
                    Total Unidades
                  </p>
                  <p className="text-xl font-black text-slate-800 dark:text-white">
                    {totalUnits.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">Huevos</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">
                    Costo Unitario
                  </p>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                    ${unitCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">Por huevo</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">
                    Total a Pagar
                  </p>
                  <p className="text-xl font-black text-green-600 dark:text-green-400">
                    ${totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Observaciones
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows={3}
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Detalles adicionales..."
              />
            </div>

            <button
              type="submit"
              disabled={
                submitting || !formData.productoId || !formData.cantidad || !formData.precio
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                'Guardando...'
              ) : (
                <>
                  <Save size={20} />
                  Confirmar Compra
                </>
              )}
            </button>
          </form>
        </div>
      </main >
    </div >
  );
}
