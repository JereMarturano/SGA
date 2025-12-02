'use client';

import Header from '@/components/Header';
import Modal from '@/components/Modal';
import { Users, Plus, Edit2, Calendar, TrendingUp, DollarSign, Clock, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Employee {
  id: number;
  name: string;
  role: string;
  startDate: string;
  monthlySales: number;
  absences: number;
  status: 'Activo' | 'Vacaciones' | 'Inactivo';
  phone: string;
}

import api from '@/lib/axios';
import { useEffect } from 'react';

interface Employee {
  id: number;
  name: string;
  role: string;
  startDate: string;
  monthlySales: number;
  absences: number;
  status: 'Activo' | 'Vacaciones' | 'Inactivo';
  phone: string;
}

export default function EmpleadosPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchEmployees = async () => {
    try {
      // The updated backend now returns UsuarioDTO with statistics and attendance data.
      // Route is /empleados, not /inventario/usuarios (which might be the generic one).
      // Let's verify if the generic one was used or if EmpleadosController's GetEmpleados is used.
      // EmpleadosController route is "api/empleados".
      // Previous code used '/inventario/usuarios' which might be from a different controller or the wrong one.
      // But looking at EmpleadosController, it is mapped to "api/empleados".
      // Let's switch to /empleados to get the new DTOs.
      const response = await api.get('/empleados');
      const data = response.data.map((u: any) => ({
        id: u.usuarioId,
        name: u.nombre,
        role: u.role, // This is now a string from the DTO
        startDate: u.fechaIngreso ? u.fechaIngreso.split('T')[0] : '2024-01-01',
        monthlySales: u.ventasDelMes || 0,
        absences: u.faltasDelMes || 0,
        status: u.estado || 'Activo',
        phone: u.telefono || 'N/A',
      }));
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsModalOpen(true);
    setShowDeleteConfirm(false);
  };

  const handleAdd = () => {
    setCurrentEmployee(null);
    setIsModalOpen(true);
    setShowDeleteConfirm(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEmployee(null);
    setShowDeleteConfirm(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!currentEmployee) {
      // Create logic
      const createData = {
        nombre: formData.get('name'),
        role: formData.get('role'),
        telefono: formData.get('phone'),
        fechaIngreso: formData.get('startDate'),
        contrasena: formData.get('password'), // New field
        // status and metrics ignored for creation or set defaults in backend
      };

      try {
        await api.post('/empleados', createData);
        handleCloseModal();
        fetchEmployees();
      } catch (error) {
        console.error('Error creating employee:', error);
        alert('Error al crear empleado.');
      }
    } else {
      // Update logic
      const updateData = {
        nombre: formData.get('name'),
        role: formData.get('role'),
        telefono: formData.get('phone'),
        fechaIngreso: formData.get('startDate'), // "YYYY-MM-DD"
        estado: formData.get('status'),
        // metrics ignored for update
      };

      try {
        await api.put(`/empleados/${currentEmployee.id}`, updateData);
        handleCloseModal();
        fetchEmployees();
      } catch (error) {
        console.error('Error updating employee:', error);
        alert('Error al actualizar empleado.');
      }
    }
  };

  const handleDelete = async () => {
    console.log('handleDelete called', currentEmployee);
    if (!currentEmployee) return;

    try {
      await api.delete(`/empleados/${currentEmployee.id}`);
      console.log('Delete successful');
      handleCloseModal();
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error al eliminar empleado. Asegúrate de que no sea el administrador.');
    }
  };

  const calculateTenure = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return `${years} año${years > 1 ? 's' : ''} ${months > 0 ? `y ${months} mes${months > 1 ? 'es' : ''}` : ''}`;
    }
    const months = Math.floor(diffDays / 30);
    return `${months} mes${months > 1 ? 'es' : ''}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white">Empleados</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de personal y estadísticas</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Empleado
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div key={employee.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-lg">
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{employee.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{employee.role}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold
                  ${employee.status === 'Activo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    employee.status === 'Vacaciones' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {employee.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">
                    <DollarSign size={12} /> Ventas (Mes)
                  </p>
                  <p className="font-bold text-slate-800 dark:text-white text-lg">{employee.monthlySales.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">
                    <Calendar size={12} /> Antigüedad
                  </p>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">{calculateTenure(employee.startDate)}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Clock size={16} /> Faltas este mes
                  </span>
                  <span className={`font-bold ${employee.absences > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {employee.absences} días
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Teléfono</span>
                  <span className="text-slate-800 dark:text-slate-200">{employee.phone}</span>
                </div>
              </div>

              <button
                onClick={() => handleEdit(employee)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 size={16} />
                Editar Perfil
              </button>
            </div>
          ))}
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentEmployee ? `Editar ${currentEmployee.name}` : 'Nuevo Empleado'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Completo</label>
            <input name="name" defaultValue={currentEmployee?.name} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Puesto / Rol</label>
              <select name="role" defaultValue={currentEmployee?.role || 'Chofer'} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Admin">Admin</option>
                <option value="Oficina">Oficina</option>
                <option value="Chofer">Chofer</option>
                <option value="Galponero">Galponero</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Encargado">Encargado</option>
                <option value="Recolector">Recolector</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
              <input name="phone" defaultValue={currentEmployee?.phone} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>

          {!currentEmployee && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
              <input type="password" name="password" required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha Ingreso</label>
              <input type="date" name="startDate" defaultValue={currentEmployee?.startDate} required className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
              <select name="status" defaultValue={currentEmployee?.status || 'Activo'} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Activo">Activo</option>
                <option value="Vacaciones">Vacaciones</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3">Métricas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ventas (Huevos/Mes)</label>
                <input type="number" name="monthlySales" defaultValue={currentEmployee?.monthlySales} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Faltas (Mes)</label>
                <input type="number" name="absences" defaultValue={currentEmployee?.absences} className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-3">
            {currentEmployee && currentEmployee.role !== 'Admin' && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 animate-fadeIn">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400 mr-2">¿Estás seguro?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-lg font-bold text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg font-bold transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              )
            )}
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">Guardar Cambios</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
