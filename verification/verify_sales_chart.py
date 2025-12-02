from playwright.sync_api import sync_playwright

def verify_sales_chart():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the dashboard
        try:
            page.goto("http://localhost:3000")
            print("Navigated to http://localhost:3000")

            # Wait for the chart to load
            page.wait_for_selector("text=Ventas de la semana")
            print("Found 'Ventas de la semana'")

            # Take a screenshot of the initial state (Week view)
            page.screenshot(path="/home/jules/verification/verification_week.png")
            print("Screenshot taken: verification_week.png")

            # Click on 'Mes' button
            page.click("button:has-text('Mes')")
            print("Clicked 'Mes' button")

            # Wait for title to change
            page.wait_for_selector("text=Ventas del mes")
            print("Found 'Ventas del mes'")

            # Take a screenshot of the Month view
            page.screenshot(path="/home/jules/verification/verification_month.png")
            print("Screenshot taken: verification_month.png")

        except Exception as e:
            print(f"Error: {e}")
            # Capture screenshot on error for debugging
            page.screenshot(path="/home/jules/verification/error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_sales_chart()
