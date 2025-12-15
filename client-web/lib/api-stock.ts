import api from './axios';
import { Ubicacion, LoteAve, EventoMortalidad, ItemInventario, Silo, ContenidoSilo } from '../types/stock';

export const getUbicaciones = async (): Promise<Ubicacion[]> => {
  const response = await api.get('/StockGeneral/ubicaciones');
  return response.data;
};

// Lotes & Mortality
export const getActiveLote = async (ubicacionId: number): Promise<LoteAve | null> => {
  const response = await api.get(`/StockGeneral/lote-activo/${ubicacionId}`);
  if (response.status === 204) return null;
  return response.data;
};

export const getLoteHistory = async (ubicacionId: number): Promise<LoteAve[]> => {
  const response = await api.get(`/StockGeneral/historial-lotes/${ubicacionId}`);
  return response.data;
};

export const createLote = async (lote: Partial<LoteAve>): Promise<LoteAve> => {
  const response = await api.post('/StockGeneral/lote', lote);
  return response.data;
};

export const updateLote = async (lote: LoteAve): Promise<LoteAve> => {
  const response = await api.put('/StockGeneral/lote', lote);
  return response.data;
};

export const registerMortalidad = async (evento: Partial<EventoMortalidad>): Promise<EventoMortalidad> => {
  const response = await api.post('/StockGeneral/mortalidad', evento);
  return response.data;
};

// Inventario
export const getInventario = async (ubicacionId: number): Promise<ItemInventario[]> => {
  const response = await api.get(`/StockGeneral/inventario/${ubicacionId}`);
  return response.data;
};

export const saveItem = async (item: Partial<ItemInventario>): Promise<ItemInventario> => {
  const response = await api.post('/StockGeneral/inventario', item);
  return response.data;
};

export const deleteItem = async (id: number): Promise<void> => {
  await api.delete(`/StockGeneral/inventario/${id}`);
};

// Silos
export const getSilos = async (): Promise<Silo[]> => {
  const response = await api.get('/StockGeneral/silos');
  return response.data;
};

export const getSiloContents = async (siloId: number): Promise<ContenidoSilo[]> => {
  const response = await api.get(`/StockGeneral/silo-contenido/${siloId}`);
  return response.data;
};

export const updateSiloContent = async (content: Partial<ContenidoSilo>): Promise<ContenidoSilo> => {
  const response = await api.post('/StockGeneral/silo-contenido', content);
  return response.data;
};
