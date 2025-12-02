
from playwright.sync_api import sync_playwright, Page, expect

def verify_mobile_menu(page: Page):
    # Set viewport to mobile size
    page.set_viewport_size({"width": 375, "height": 812})

    # Go to homepage (ensure the server is running)
    page.goto("http://localhost:3000")

    # Wait for the header to be visible
    page.wait_for_selector("header")

    # Take screenshot of closed menu state
    page.screenshot(path="verification/mobile-menu-closed.png")

    # Click the menu button
    # The button has a Menu icon inside, but we can target the button directly.
    # In my code: <button className="md:hidden ..." onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
    # I can try to find by role 'button' that contains the Menu icon or just use the 3rd button in the header (if notification is a button too)
    # The button has `md:hidden` class.

    # Let's try to find it by the Menu icon SVG, or simpler, the button that is visible only on mobile.
    menu_button = page.locator("header button.md\\:hidden")
    expect(menu_button).to_be_visible()
    menu_button.click()

    # Wait for menu to open (animation)
    page.wait_for_timeout(1000)

    # Take screenshot of open menu
    page.screenshot(path="verification/mobile-menu-open.png")

    # Verify links are visible
    expect(page.get_by_text("Dashboard", exact=True)).to_be_visible()
    expect(page.get_by_text("Vehículos")).to_be_visible()

    # Verify user profile in menu
    expect(page.get_by_text("Santiago")).to_be_visible()

    print("Mobile menu verification successful!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_mobile_menu(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
