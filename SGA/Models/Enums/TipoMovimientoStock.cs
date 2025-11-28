namespace SGA.Models.Enums;

public enum TipoMovimientoStock
{
    CargaInicial,       // Admin carga la camioneta
    Recarga,           // Carga adicional durante el día
    Venta,             // Salida por venta a cliente
    DevolucionCliente, // Cliente devuelve producto
    DescargaFinal,     // Lo que sobra al final del día (si se baja)
    Merma,             // Roturas o pérdidas
    AjusteInventario   // Correcciones manuales
}
