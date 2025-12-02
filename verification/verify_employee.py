
from playwright.sync_api import sync_playwright

def verify_employee_edit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to employees page
        page.goto('http://localhost:3000/empleados')

        # Wait for employees to load (or show no employees)
        page.wait_for_selector('text=Empleados')

        # Take screenshot of the list
        page.screenshot(path='verification/employees_list.png')

        # Click on 'Nuevo Empleado' to check modal opens
        page.click('text=Nuevo Empleado')
        page.wait_for_selector('text=Nuevo Empleado')

        # Take screenshot of the modal
        page.screenshot(path='verification/new_employee_modal.png')

        browser.close()

if __name__ == '__main__':
    try:
        verify_employee_edit()
        print('Verification script finished successfully.')
    except Exception as e:
        print(f'Verification script failed: {e}')
