
import { test, expect } from '@playwright/test';

test('Nueva Venta screenshot verification', async ({ page }) => {
  // Mock API responses
  await page.route('**/api/clientes', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { clienteId: 1, nombre: 'Cliente Screenshot', direccion: 'Direccion 1' }
      ])
    });
  });

  await page.route('**/api/productos', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { productoId: 1, nombre: 'Huevo Grande Blanco', precio: 4500, stockActual: 100, esHuevo: true }
      ])
    });
  });

  await page.route('**/api/vehiculos', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { vehiculoId: 1, patente: 'AA123BB', marca: 'Ford', modelo: 'Transit' }
      ])
    });
  });

  // Navigate to page
  await page.goto('http://localhost:3000/punto-venta');

  // Select Client
  await page.getByText('Cliente Screenshot').click();

  // Add item
  const card = page.locator('div').filter({ hasText: 'Huevo Grande Blanco' }).filter({ has: page.locator('button') }).last();
  await card.locator('button').click();
  await card.locator('button').click(); // 2 items

  // Continue to payment
  await page.getByText('Continuar al Pago').click();

  // Apply 5% discount
  await page.getByText('5%').click();

  // Select "Tarjeta"
  await page.getByText('Tarjeta').click();

  // Take screenshot
  await page.screenshot({ path: 'verification/nueva_venta_ui.png', fullPage: true });
});
