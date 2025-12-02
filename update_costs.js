async function updateCosts() {
    try {
        const res = await fetch('http://localhost:5035/api/productos');
        const products = await res.json();

        for (const p of products) {
            if (p.costoUltimaCompra === 0) {
                console.log(`Updating cost for ${p.nombre}`);
                // Set a dummy cost: 100 per egg (so 3000 per maple)
                p.costoUltimaCompra = 100;

                await fetch(`http://localhost:5035/api/productos/${p.productoId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(p)
                });
            }
        }
        console.log('Done');
    } catch (error) {
        console.error(error);
    }
}

updateCosts();
