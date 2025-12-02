async function listUsers() {
    try {
        const res = await fetch('http://localhost:5035/api/usuarios');
        if (res.ok) {
            const users = await res.json();
            console.log('Users:', JSON.stringify(users, null, 2));
        } else {
            console.log('Failed to list users (Status: ' + res.status + ')');
        }
    } catch (error) {
        console.log('Error listing users:', error.message);
    }
}

listUsers();
