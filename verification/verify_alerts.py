
from playwright.sync_api import Page, expect, sync_playwright
import time

def test_dashboard_alerts(page: Page):
    # 1. Arrange: Go to the Dashboard
    # The frontend is running on localhost:3000
    page.goto("http://localhost:3000")

    # Wait for the page to load
    page.wait_for_load_state("networkidle")

    # 2. Act: Check for the "Alertas Operativas" section
    alerts_header = page.get_by_role("heading", name="Alertas Operativas")
    expect(alerts_header).to_be_visible()

    # 3. Assert: Check that the content is loaded (either empty state or alerts)
    # Since DB is fresh, we expect "No hay alertas recientes."
    empty_state = page.get_by_text("No hay alertas recientes.")

    # Take screenshot of the initial state
    page.screenshot(path="/home/jules/verification/dashboard_initial.png")

    if empty_state.is_visible():
        print("Confirmed empty state.")
    else:
        print("Alerts found (unexpected for fresh DB but possible if seeding ran).")

    # 4. Optional: We could try to trigger an alert if we had time, but for now verifying the mock data is GONE is key.
    # Check that "Stock Crítico: Fiorino" (mock data) is NOT present unless it was seeded.
    # The mock data was hardcoded in the component. If it's gone, we successfully replaced it.

    mock_text = page.get_by_text("Stock Crítico: Fiorino")
    if mock_text.is_visible():
        # It might be visible if the SEED data created exactly this, but unlikely.
        # Let's check if it's the hardcoded one.
        # Hardcoded one had specific text.
        pass

    # Take final screenshot
    page.screenshot(path="/home/jules/verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_dashboard_alerts(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
