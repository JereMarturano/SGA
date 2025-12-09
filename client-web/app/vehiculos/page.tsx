'use client';

import Header from '@/components/Header';
import Modal from '@/components/Modal';
import { Truck, Plus, Edit2, Droplets, Gauge, AlertTriangle, Disc } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/axios';
import { useEffect } from 'react';
import { vehicleSchema } from '@/lib/schemas';
import { z } from 'zod';

interface Vehicle {
  id: number;
  name: string;
  plate: string;
  mileage: number;
  lastOilChange: string;
  oilType: string;
  nextOilChangeKm: number;
  notes: string;
  tireCondition: 'Bueno' | 'Regular' | 'Malo';
  status: 'Activo' | 'Mantenimiento' | 'Inactivo';
}

export default function VehiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehiculos');
      const data = response.data.map((v: any) => ({
        id: v.vehiculoId,
        name: `${v.marca} ${v.modelo}`,
        plate: v.patente,
        mileage: v.kilometraje,
        lastOilChange: v.ultimoCambioAceite ? new Date(v.ultimoCambioAceite).toISOString().split('T')[0] : '',
        oilType: v.tipoAceite || '',
        nextOilChangeKm: v.kilometrajeProximoCambioAceite || (v.kilometraje + 10000),
        notes: v.notas || '',
        tireCondition: v.estadoCubiertas || 'Bueno',
        status: v.estado || 'Activo',
      }));
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleEdit = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setCurrentVehicle(null); // New vehicle
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentVehicle(null);
    setErrors({});
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const formData = new FormData(e.currentTarget);

    // Parse name to split brand/model carefully. Simple approach for now.
    // The user inputs "Brand Model" in one field.
    const fullName = formData.get('name') as string;
    const parts = fullName.split(' ');
    const marca = parts[0] || 'Desconocido';
    const modelo = parts.slice(1).join(' ') || 'Modelo';

    const rawData = {
      name: fullName,
      plate: formData.get('plate'),
      mileage: formData.get('mileage'),
      status: formData.get('status'),
      lastOilChange: formData.get('lastOilChange') || null,
      oilType: formData.get('oilType'),
      nextOilChangeKm: formData.get('nextOilChangeKm'),
      tireCondition: formData.get('tireCondition'),
      notes: formData.get('notes'),
    };

    const validationResult = vehicleSchema.safeParse(rawData);

    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        newErrors[err.path[0] as string] = err.message;
      });
      setErrors(newErrors);
      return;
    }

    const payload = {
      patente: rawData.plate,
      marca: marca,
      modelo: modelo,
      kilometraje: Number(rawData.mileage),
      estado: rawData.status,
      ultimoCambioAceite: rawData.lastOilChange ? new Date(rawData.lastOilChange as string).toISOString() : null,
      tipoAceite: rawData.oilType,
      kilometrajeProximoCambioAceite: Number(rawData.nextOilChangeKm),
      estadoCubiertas: rawData.tireCondition,
      notas: rawData.notes,
      consumoPromedioLts100Km: 10, // Default or add field
      capacidadCarga: 1000, // Default or add field
      id_Chofer_Asignado: null,
      enRuta: currentVehicle?.status === 'Activo' && currentVehicle?.notes?.includes('reparto') // Preserve logic if needed
    };

    try {
      if (currentVehicle) {
        await api.put(`/vehiculos/${currentVehicle.id}`, payload);
      } else {
        await api.post('/vehiculos', payload);
      }
      handleCloseModal();
      fetchVehicles();
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        // Handle backend validation errors if any
        const backendErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([key, val]: [string, any]) => {
          backendErrors[key.toLowerCase()] = val[0];
        });
        // Map backend fields to frontend fields if necessary, or just show alert
        alert('Error de validación del servidor: ' + JSON.stringify(backendErrors));
      } else {
        alert('Error al guardar el vehículo. Verifique los datos.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white">Vehículos</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de flota y mantenimiento</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Vehículo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group relative">
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold
                  ${vehicle.status === 'Activo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    vehicle.status === 'Mantenimiento' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {vehicle.status}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{vehicle.name}</h3>
                  <p className="text-sm font-mono text-slate-500 dark:text-slate-400">{vehicle.plate}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Gauge size={18} />
                    <span className="text-sm font-medium">Kilometraje</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{vehicle.mileage.toLocaleString()} km</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Droplets size={18} />
                    <span className="text-sm font-medium">Próx. Cambio</span>
                  </div>
                  <div className="text-right">
                    <span className={`block font-bold ${vehicle.mileage >= vehicle.nextOilChangeKm ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                      {vehicle.nextOilChangeKm.toLocaleString()} km
                    </span>
                    <span className="text-xs text-slate-400 block">{vehicle.oilType}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Disc size={18} />
                    <span className="text-sm font-medium">Cubiertas</span>
                  </div>
                  <span className={`font-bold text-sm px-2 py-0.5 rounded-lg
                        ${vehicle.tireCondition === 'Bueno' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                      vehicle.tireCondition === 'Regular' ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' :
                        'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                    {vehicle.tireCondition}
                  </span>
                </div>

                {vehicle.notes && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl">
                    <div className="flex gap-2 text-yellow-700 dark:text-yellow-500 mb-1">
                      <AlertTriangle size={14} />
                      <span className="text-xs font-bold uppercase">Notas</span>
                    </div>
                    <p className="text-xs text-yellow-800 dark:text-yellow-400 italic">"{vehicle.notes}"</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleEdit(vehicle)}
                className="w-full mt-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 size={16} />
                Editar / Registrar Mantenimiento
              </button>
            </div>
          ))}
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentVehicle ? `Editar ${currentVehicle.name}` : 'Nuevo Vehículo'}
      >
        <form id="vehicleForm" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre / Modelo</label>
              <input name="name" defaultValue={currentVehicle?.name} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Patente</label>
              <input name="plate" defaultValue={currentVehicle?.plate} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              {errors.plate && <p className="text-red-500 text-xs">{errors.plate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kilometraje Actual</label>
              <input type="number" name="mileage" defaultValue={currentVehicle?.mileage} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              {errors.mileage && <p className="text-red-500 text-xs">{errors.mileage}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
              <select name="status" defaultValue={currentVehicle?.status || 'Activo'} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Activo">Activo</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3">Mantenimiento</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Último Cambio Aceite</label>
                <input type="date" name="lastOilChange" defaultValue={currentVehicle?.lastOilChange} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                {errors.lastOilChange && <p className="text-red-500 text-xs">{errors.lastOilChange}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Próximo Cambio (Km)</label>
                <input type="number" name="nextOilChangeKm" defaultValue={currentVehicle?.nextOilChangeKm} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                {errors.nextOilChangeKm && <p className="text-red-500 text-xs">{errors.nextOilChangeKm}</p>}
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Aceite</label>
                <input name="oilType" defaultValue={currentVehicle?.oilType} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ej: 5W-30 Sintético" />
                {errors.oilType && <p className="text-red-500 text-xs">{errors.oilType}</p>}
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado Cubiertas</label>
                <select name="tireCondition" defaultValue={currentVehicle?.tireCondition || 'Bueno'} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="Bueno">Bueno</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>
                {errors.tireCondition && <p className="text-red-500 text-xs">{errors.tireCondition}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas / Observaciones</label>
            <textarea name="notes" defaultValue={currentVehicle?.notes} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white h-24" placeholder="Detalles adicionales..." />
            {errors.notes && <p className="text-red-500 text-xs">{errors.notes}</p>}
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
