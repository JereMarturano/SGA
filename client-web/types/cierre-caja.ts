export interface CierreCajaDiario {
    cierreId?: number;
    fecha: string; // ISO Date
    totalVentas: number;
    totalGastos: number;
    totalHuevosVendidos: number;
    saldoNeto: number;
    usuarioId?: number;
    usuario?: {
        nombre: string;
        apellido: string;
    };
    fechaCierre?: string;
    observaciones?: string;
}
