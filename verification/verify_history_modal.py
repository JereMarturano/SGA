
from playwright.sync_api import sync_playwright

def verify_history_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We need the frontend running. It is running on localhost:3000 from previous step?
        # Let's check jobs.

        try:
            page.goto('http://localhost:3000/clientes')
            page.wait_for_selector('h1:has-text("Clientes")')

            # Take screenshot of main page
            page.screenshot(path='verification/clients_main.png')

            # Click the history button of the first client (if any)
            # We need to find the history button. It has a title 'Ver Historial'

            # But first we might need to wait for clients to load.
            # The page fetches clients on mount.
            page.wait_for_timeout(2000)

            history_btn = page.locator('button[title="Ver Historial"]').first
            if history_btn.is_visible():
                history_btn.click()
                page.wait_for_selector('h3:has-text("Historial")')
                page.screenshot(path='verification/history_modal.png')
                print('History modal screenshot taken')
            else:
                print('No clients found or history button not visible')

        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    verify_history_modal()
