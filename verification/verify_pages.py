from playwright.sync_api import sync_playwright

def verify_pages():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Base URL
        base_url = "http://localhost:3000"

        # Verify Home
        print("Navigating to Home...")
        page.goto(base_url)
        page.wait_for_timeout(2000) # Wait for hydration
        page.screenshot(path="verification/home.png")
        print("Home screenshot taken.")

        # Verify Vehiculos
        print("Navigating to Vehiculos...")
        page.goto(f"{base_url}/vehiculos")
        page.wait_for_timeout(2000)
        page.screenshot(path="verification/vehiculos.png")
        print("Vehiculos screenshot taken.")

        # Click on Add Vehicle
        page.get_by_role("button", name="Nuevo Vehículo").click()
        page.wait_for_timeout(500)
        page.screenshot(path="verification/vehiculos_modal.png")
        page.get_by_role("button", name="Cancelar").click()
        print("Vehiculos modal screenshot taken.")

        # Verify Empleados
        print("Navigating to Empleados...")
        page.goto(f"{base_url}/empleados")
        page.wait_for_timeout(2000)
        page.screenshot(path="verification/empleados.png")
        print("Empleados screenshot taken.")

        # Verify Clientes
        print("Navigating to Clientes...")
        page.goto(f"{base_url}/clientes")
        page.wait_for_timeout(2000)
        page.screenshot(path="verification/clientes.png")
        print("Clientes screenshot taken.")

        # Verify Estadisticas
        print("Navigating to Estadisticas...")
        page.goto(f"{base_url}/estadisticas")
        page.wait_for_timeout(2000)
        page.screenshot(path="verification/estadisticas.png")
        print("Estadisticas screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_pages()
