from playwright.sync_api import Page, expect, sync_playwright

def debug_console(page: Page):
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))
    page.goto("http://localhost:3000/stock-general")
    page.wait_for_timeout(5000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        debug_console(page)
        browser.close()
