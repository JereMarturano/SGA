from playwright.sync_api import Page, expect, sync_playwright
import os

def debug_dashboard(page: Page):
    page.goto("http://localhost:3000/stock-general")
    page.wait_for_timeout(5000)
    page.screenshot(path="verification/dashboard_debug.png")
    print("Screenshot saved to verification/dashboard_debug.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        debug_dashboard(page)
        browser.close()
