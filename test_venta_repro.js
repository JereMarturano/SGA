async function testVenta() {
    try {
        // 1. Fetch dependencies
        console.log('Fetching dependencies...');
        const [vehiculosRes, clientesRes, productosRes] = await Promise.all([
            fetch('http://localhost:5035/api/vehiculos'),
            fetch('http://localhost:5035/api/clientes'),
            fetch('http://localhost:5035/api/productos')
        ]);

        const vehiculos = await vehiculosRes.json();
        const clientes = await clientesRes.json();
        const productos = await productosRes.json();

        if (vehiculos.length === 0 || clientes.length === 0 || productos.length === 0) {
            console.log('Missing data to test sale.');
            return;
        }

        const vehiculoId = vehiculos[0].vehiculoId;
        const clienteId = clientes[0].clienteId;
        const productoId = productos[0].productoId;

        console.log(`Using: Vehiculo=${vehiculoId}, Cliente=${clienteId}, Producto=${productoId}, Usuario=3`);

        // Check initial stock
        const stockRes1 = await fetch(`http://localhost:5035/api/inventario/stock-vehiculo/${vehiculoId}`);
        const stock1 = await stockRes1.json();
        const itemStock1 = stock1.find(s => s.productoId === productoId)?.cantidad || 0;
        console.log(`Initial Stock: ${itemStock1}`);

        // 2. Prepare payload
        const payload = {
            clienteId: clienteId,
            usuarioId: 3,
            vehiculoId: vehiculoId,
            metodoPago: 0, // Efectivo
            fecha: new Date().toISOString(),
            items: [
                {
                    productoId: productoId,
                    cantidad: 1, // 1 unit
                    precioUnitario: 100
                }
            ]
        };

        // 3. Send request
        console.log('Sending sale request...');
        const res = await fetch('http://localhost:5035/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            console.log('Sale successful!');
            const data = await res.json();
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(`Sale failed with status ${res.status}`);
            const text = await res.text();
            console.log('Response body:', text);
        }

        // Check final stock
        const stockRes2 = await fetch(`http://localhost:5035/api/inventario/stock-vehiculo/${vehiculoId}`);
        const stock2 = await stockRes2.json();
        const itemStock2 = stock2.find(s => s.productoId === productoId)?.cantidad || 0;
        console.log(`Final Stock: ${itemStock2}`);
        console.log(`Stock diff: ${itemStock2 - itemStock1}`);

    } catch (error) {
        console.log('Error:', error.message);
    }
}

testVenta();
