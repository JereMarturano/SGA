export interface ReporteFinanciero {
  fechaInicio: string;
  fechaFin: string;
  totalVentas: number;
  totalCostoMercaderia: number;
  totalGastos: number;
  gananciaNeta: number;
  totalPerdidaMermas: number;
  margenGananciaPorcentaje: number;
  ventasPorMetodoPago: VentaPorMetodoPago[];
  ventasPorProducto: VentaPorProducto[];
  ventasPorFecha: VentaPorFecha[];
  gastosPorTipo: GastoPorTipo[];
  cantidadVentas: number;
  ticketPromedio: number;

  // Nuevas estadísticas
  topClientes: VentaPorCliente[];
  ventasPorVendedor: VentaPorVendedor[];
  deudaTotalActual: number;

  // Métricas de Comparación
  variacionVentas: number;
  tendenciaVentasPositiva: boolean;
  variacionMargen: number;
  tendenciaMargenPositiva: boolean;
}

export interface VentaPorMetodoPago {
  metodoPago: number;
  total: number;
  cantidadTransacciones: number;
}

export interface VentaPorProducto {
  productoId: number;
  nombreProducto: string;
  cantidadVendida: number;
  totalGenerado: number;
}

export interface VentaPorFecha {
  fecha: string;
  total: number;
  cantidadVentas: number;
}

export interface GastoPorTipo {
  tipoGasto: number;
  total: number;
  cantidadRegistros: number;
}

export interface VentaPorCliente {
  clienteId: number;
  nombreCliente: string;
  totalComprado: number;
  cantidadCompras: number;
}

export interface VentaPorVendedor {
  usuarioId: number;
  nombreVendedor: string;
  totalVendido: number;
  cantidadVentas: number;
}

export const fetchReporteFinanciero = async (
  inicio: Date,
  fin: Date
): Promise<ReporteFinanciero> => {
  const inicioStr = inicio.toISOString();
  const finStr = fin.toISOString();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/reportes/financiero?inicio=${inicioStr}&fin=${finStr}`
  );
  if (!res.ok) throw new Error('Error al obtener reporte financiero');
  return res.json();
};
