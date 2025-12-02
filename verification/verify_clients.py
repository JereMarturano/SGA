
from playwright.sync_api import sync_playwright

def verify_clients_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to Clients page (assuming localhost:3000 if frontend is running, but I need to start it first)
        # Since I haven't started the frontend, I should do that.
        # But wait, I am in a backend context mostly. The frontend is Next.js.
        # I need to start the frontend server in background.

        try:
            page.goto('http://localhost:3000/clientes')
            page.wait_for_selector('h1:has-text("Clientes")')

            # Click on Deuda Actual to open Debt Modal
            # Since I can't easily mock backend data in this live test without a running backend and DB,
            # this verification might fail if the backend isn't reachable or data is empty.
            # However, I can try to see if the page loads static elements.

            page.screenshot(path='verification/clients_page.png')
            print('Screenshot taken')
        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    verify_clients_page()
