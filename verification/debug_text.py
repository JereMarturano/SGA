from playwright.sync_api import Page, expect, sync_playwright

def debug_dashboard(page: Page):
    page.goto("http://localhost:3000/stock-general")
    page.wait_for_timeout(5000)
    content = page.content()
    if "Galpon 1" in content:
        print("FOUND: Galpon 1")
    else:
        print("NOT FOUND: Galpon 1")

    if "Administración de Stock General" in content:
        print("FOUND: Heading")
    else:
        print("NOT FOUND: Heading")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        debug_dashboard(page)
        browser.close()
