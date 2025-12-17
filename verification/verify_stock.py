from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_stock_general(page: Page):
    print("Starting verification...")
    # 1. Arrange: Go to the new Stock General Dashboard
    # Ensure frontend is running (default port 3000)
    page.goto("http://localhost:3000/stock-general")
    print("Navigated to dashboard")

    # Wait for heading
    expect(page.get_by_role("heading", name="Administración de Stock General")).to_be_visible(timeout=10000)

    # Check for Galpones section
    expect(page.get_by_text("Galpones (Aves)")).to_be_visible()
    # Check for specific Galpones (auto-generated in backend, frontend displays them)
    # Wait for data load
    page.wait_for_timeout(6000)

    # 3. Navigate to a Galpon page (e.g. Galpon 1)
    # Find a button that says "Galpon 1"
    page.get_by_role("button", name="Galpon 1").click()

    # 4. Verify Galpon Page
    expect(page.get_by_role("heading", name="Galpón")).to_be_visible()
    expect(page.get_by_text("Historial de Lotes")).to_be_visible()

    # 5. Screenshot (use relative path to current dir)
    cwd = os.getcwd()
    path = os.path.join(cwd, "verification/stock_general_galpon.png")
    print(f"Saving screenshot to {path}")
    page.screenshot(path=path)
    print("Screenshot taken")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_stock_general(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
