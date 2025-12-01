
import { test, expect } from '@playwright/test';

test('Nueva Venta flow with discount and payment methods', async ({ page }) => {
  // Mock API responses
  await page.route('**/api/clientes', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { clienteId: 1, nombre: 'Cliente Test 1', direccion: 'Direccion 1' },
        { clienteId: 2, nombre: 'Cliente Test 2', direccion: 'Direccion 2' }
      ])
    });
  });

  await page.route('**/api/productos', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { productoId: 1, nombre: 'Huevo Test 1', precio: 1000, stockActual: 100, esHuevo: true },
        { productoId: 2, nombre: 'Huevo Test 2', precio: 2000, stockActual: 50, esHuevo: true },
        { productoId: 3, nombre: 'No Huevo', precio: 500, stockActual: 10, esHuevo: false }
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

  await page.route('**/api/ventas', async route => {
    const postData = route.request().postDataJSON();
    console.log('Venta submit payload:', postData);

    if (postData.descuentoPorcentaje === 10 && postData.metodoPago === 4 && postData.items.length > 0) {
         await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Venta registrada' })
        });
    } else {
        await route.fulfill({ status: 400, body: 'Invalid payload' });
    }
  });

  // Navigate to page
  await page.goto('http://localhost:3000/punto-venta');

  // Step 1: Select Client and Vehicle
  await expect(page.getByText('Nueva Venta')).toBeVisible();

  // Select Client
  await page.getByText('Cliente Test 1').click();

  // Step 2: Select Products
  await expect(page.getByText('Huevo Test 1')).toBeVisible();

  // Add items
  // There are two visible products: Huevo Test 1 and Huevo Test 2.
  // We want to add Huevo Test 1.
  // The structure is Text -> Price -> Stock -> Button.
  // Let's try to find the button by the text inside the same card.
  // Or simply, since we know Huevo Test 1 is the first one...
  // Let's use getByRole('button') but filter by having an SVG (the Plus icon).
  // Or just click the first button that is NOT the back button or notification bell.
  // The product buttons are after the header.

  // Let's rely on the fact that the button is a sibling of the text "Huevo Test 1" in a parent container.
  // .locator('div', { has: page.getByText('Huevo Test 1') }) found the card, but maybe the button role wasn't clear.
  // The button has <Plus /> inside.

  // Try clicking specifically on the card that contains "Huevo Test 1"
  const card = page.locator('div').filter({ hasText: 'Huevo Test 1' }).filter({ has: page.locator('button') }).last();
  await card.locator('button').click();
  await card.locator('button').click();

  // Check cart total
  await expect(page.getByText('$2,000')).toBeVisible();

  // Continue to payment
  await page.getByText('Continuar al Pago').click();

  // Step 3: Confirmation
  // Check subtotal
  await expect(page.getByText('$2,000').first()).toBeVisible();

  // Apply 10% discount
  await page.getByText('10%').click();

  // Check discount amount (10% of 2000 = 200)
  await expect(page.getByText('-$200')).toBeVisible();

  // Check total (1800)
  await expect(page.getByText('$1,800')).toBeVisible();

  // Select "Tarjeta" as payment method
  await page.getByText('Tarjeta').click();

  // Confirm Sale
  page.on('dialog', dialog => dialog.dismiss());

  await page.getByText('Confirmar Venta').click();
});
