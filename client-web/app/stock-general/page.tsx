'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ubicacion } from '@/types/stock';
import { getUbicaciones } from '@/lib/api-stock';
import { LayoutDashboard, Warehouse, Wrench, Egg, Home } from 'lucide-react';

export default function StockGeneralPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadUbicaciones();
  }, []);

  const loadUbicaciones = async () => {
    try {
      const data = await getUbicaciones();
      setUbicaciones(data);
    } catch (error) {
      console.error('Failed to load locations', error);
    }
  };

  const getIcon = (type: string, name: string) => {
    if (name.includes('Galpon')) return <Home className="h-8 w-8 text-orange-600" />;
    if (name.includes('Pollitos')) return <Egg className="h-8 w-8 text-yellow-500" />;
    if (name.includes('Silo')) return <Warehouse className="h-8 w-8 text-blue-600" />;
    if (name.includes('Taller')) return <Wrench className="h-8 w-8 text-gray-600" />;
    return <LayoutDashboard className="h-8 w-8 text-green-600" />;
  };

  // Group locations
  const galpones = ubicaciones.filter(u => u.nombre.includes('Galpon'));
  const pollitos = ubicaciones.filter(u => u.nombre.includes('Pollitos'));
  const silos = ubicaciones.filter(u => u.nombre.includes('Silo') || u.tipo === 'Silo'); // 'Silo' might be separate entity but let's see if we unified them.
  // Wait, I created a separate Silo entity in Backend but also "ensureLocations" creates Ubicaciones?
  // In StockService.EnsureLocationsExistAsync, I didn't add Silos to Ubicaciones table, I added them to Silos table.
  // BUT, the Dashboard needs to link to Silos.
  // I should probably manually add a "Silos" card here that links to a silos page.

  const depositos = ubicaciones.filter(u => u.nombre.includes('Deposito'));
  const talleres = ubicaciones.filter(u => u.nombre.includes('Taller'));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Administración de Stock General</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Galpones Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-orange-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Home className="h-6 w-6" /> Galpones (Aves)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {galpones.map(g => (
              <button
                key={g.id}
                onClick={() => router.push(`/stock-general/galpon/${g.id}`)}
                className="p-4 bg-orange-50 rounded hover:bg-orange-100 transition text-center border border-orange-200"
              >
                {g.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Pollitos Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Egg className="h-6 w-6" /> Cría (Pollitos)
          </h2>
          <div className="flex flex-col gap-2">
            {pollitos.map(p => (
               <button
               key={p.id}
               onClick={() => router.push(`/stock-general/galpon/${p.id}?type=pollito`)} // Reusing Galpon page but maybe specialized
               className="p-4 bg-yellow-50 rounded hover:bg-yellow-100 transition text-center border border-yellow-200"
             >
               {p.nombre}
             </button>
            ))}
          </div>
        </div>

        {/* Silos Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Warehouse className="h-6 w-6" /> Alimentación (Silos)
          </h2>
           <button
               onClick={() => router.push(`/stock-general/silos`)}
               className="w-full p-4 bg-blue-50 rounded hover:bg-blue-100 transition text-center border border-blue-200"
             >
               Gestionar Silos
             </button>
        </div>

        {/* Deposito Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" /> Depósito General
          </h2>
          {depositos.map(d => (
             <button
               key={d.id}
               onClick={() => router.push(`/stock-general/inventario/${d.id}`)}
               className="w-full p-4 mb-2 bg-green-50 rounded hover:bg-green-100 transition text-center border border-green-200"
             >
               {d.nombre} (Maples, etc)
             </button>
          ))}
        </div>

        {/* Taller Section */}
         <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-gray-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wrench className="h-6 w-6" /> Taller y Mantenimiento
          </h2>
          {talleres.map(t => (
             <button
               key={t.id}
               onClick={() => router.push(`/stock-general/inventario/${t.id}`)}
               className="w-full p-4 mb-2 bg-gray-50 rounded hover:bg-gray-100 transition text-center border border-gray-200"
             >
               {t.nombre}
             </button>
          ))}
        </div>

      </div>
    </div>
  );
}
