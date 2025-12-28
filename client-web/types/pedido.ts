export enum EstadoPedido {
    Pendiente = 0,
    Asignado = 1,
    Entregado = 2,
    Cancelado = 3
}

export interface DetallePedido {
    detalleId: number;
    pedidoId: number;
    productoId: number;
    producto?: { nombre: string };
    productoNombre?: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    subtotal: number;
}

export interface Pedido {
    pedidoId: number;
    clienteId: number;
    cliente?: { nombre: string; apellido: string; nombreCompleto?: string; direccion?: string };
    clienteNombre?: string;
    fechaPedido: string;
    fechaEntrega?: string;
    estado: EstadoPedido;
    viajeId?: number;
    observaciones?: string;
    detalles: DetallePedido[];
    totalEstimado?: number;
    estaPagado?: boolean;
}
