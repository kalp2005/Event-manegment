document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const loginLink = document.querySelector('.SignInLink');
    const registerLink = document.querySelector('.SignUpLink');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // --- UI TOGGLE LOGIC ---
    registerLink.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent the link from navigating
        container.classList.add('active');
    });

    loginLink.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent the link from navigating
        container.classList.remove('active');
    });

    // --- AUTHENTICATION LOGIC ---

    // Function to get users from localStorage
    const getUsers = () => {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    };

    // Function to save users to localStorage
    const saveUsers = (users) => {
        localStorage.setItem('users', JSON.stringify(users));
    };

    // Handle Registration
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        const users = getUsers();
        const userExists = users.find(user => user.username === username);

        if (userExists) {
            alert('Username already exists. Please choose another.');
            return;
        }

        const newUser = { username, email, password };
        users.push(newUser);
        saveUsers(users);

        alert('Registration successful! Please log in.');
        container.classList.remove('active'); // Switch to login form
        registerForm.reset();
    });

    // Handle Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const users = getUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            // Use sessionStorage to store login state for the current session
            sessionStorage.setItem('loggedInUser', username);
            window.location.href = 'index.html'; // Redirect to the main app
        } else {
            alert('Invalid username or password.');
        }
    });
});
