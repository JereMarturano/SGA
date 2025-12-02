
from playwright.sync_api import sync_playwright

def verify_statistics():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the statistics page
            page.goto('http://localhost:3000/estadisticas')

            # Wait for content to load
            page.wait_for_selector('h1:has-text("Estadísticas Generales")', timeout=10000)

            # Take a screenshot
            page.screenshot(path='verification/statistics_page.png', full_page=True)
            print('Screenshot taken successfully.')
        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    verify_statistics()
