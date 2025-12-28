namespace SGA.Models.Enums;

public enum EstadoPedido
{
    Pendiente = 0,
    Asignado = 1, // Asignado a un Viaje/Chofer
    Entregado = 2,
    Cancelado = 3
}
