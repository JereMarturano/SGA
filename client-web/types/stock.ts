export enum TipoAve {
  Gallina = 0,
  Pollito = 1,
}

export interface Ubicacion {
  id: number;
  nombre: string;
  tipo: string;
}

export interface LoteAve {
  id: number;
  ubicacionId: number;
  tipoAve: TipoAve;
  cantidadInicial: number;
  cantidadActual: number;
  fechaAlta: string;
  fechaBaja?: string;
  precioCompra: number;
  activo: boolean;
}

export interface EventoMortalidad {
  id: number;
  loteId: number;
  fecha: string;
  cantidad: number;
  motivo: string;
  usuarioId?: number;
}

export interface ItemInventario {
  id: number;
  nombre: string;
  descripcion?: string;
  ubicacionId: number;
  cantidad: number;
  unidadMedida: string;
  categoria: string;
}

export interface Silo {
  id: number;
  nombre: string;
  capacidadMaxima: number;
}

export interface ContenidoSilo {
  id: number;
  siloId: number;
  nombreMaterial: string;
  cantidad: number;
  unidadMedida: string;
  costoPorUnidad: number;
  ultimaActualizacion: string;
}
