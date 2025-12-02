async function createAdminUser() {
    try {
        const payload = {
            nombre: "Admin",
            role: "Admin",
            contrasena: "admin123",
            telefono: "123456789",
            fechaIngreso: new Date().toISOString()
        };

        const res = await fetch('http://localhost:5035/api/empleados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const user = await res.json();
            console.log('User created:', JSON.stringify(user, null, 2));
        } else {
            console.log('Failed to create user (Status: ' + res.status + ')');
            const text = await res.text();
            console.log('Response:', text);
        }
    } catch (error) {
        console.log('Error creating user:', error.message);
    }
}

createAdminUser();
