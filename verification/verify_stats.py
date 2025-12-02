from playwright.sync_api import sync_playwright

def verify_statistics(page):
    # 1. Arrange: Go to the statistics page
    page.goto("http://localhost:3000/estadisticas")

    # Wait for the page to load (look for the title)
    page.wait_for_selector("text=Estadísticas Generales")

    # Wait for data to load (wait for the "Deuda Clientes Total" card to appear)
    # This confirms the new backend field is being rendered
    page.wait_for_selector("text=Deuda Clientes Total")

    # Scroll down to see the new sections
    page.evaluate("window.scrollBy(0, 500)")

    # Take a screenshot
    page.screenshot(path="verification/stats_page.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to ensure cards are visible
        page = browser.new_page(viewport={"width": 1280, "height": 1600})
        try:
            verify_statistics(page)
            print("Verification script executed successfully.")
        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()
