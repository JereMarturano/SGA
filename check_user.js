async function checkUser() {
    try {
        const res = await fetch('http://localhost:5035/api/usuarios/1');
        if (res.ok) {
            console.log('User 1 exists');
        } else {
            console.log('User 1 does NOT exist (Status: ' + res.status + ')');
        }
    } catch (error) {
        console.log('Error checking user:', error.message);
    }
}

checkUser();
