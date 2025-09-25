document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const container = document.querySelector('.container');
    const loginLink = document.querySelector('.SignInLink');
    const registerLink = document.querySelector('.SignUpLink');

    // --- Forms ---
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // --- OTP Related Elements ---
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpSection = document.getElementById('otpSection');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    
    // --- Toast Notification Elements ---
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // --- Logic Variables ---
    let generatedOtp = null;
    let timerInterval = null;

    // --- UI TOGGLE LOGIC (Login <-> Register) ---
    registerLink.addEventListener('click', () => container.classList.add('active'));
    loginLink.addEventListener('click', () => container.classList.remove('active'));

    // --- Helper Functions ---
    const showToast = (message) => {
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    };

    // THIS IS THE TIMER FUNCTION
    const startTimer = () => {
        let timeLeft = 30;
        resendOtpBtn.disabled = true; // Disable the button
        resendOtpBtn.textContent = `Resend in ${timeLeft}s`;

        clearInterval(timerInterval); // Clear any existing timer
        timerInterval = setInterval(() => {
            timeLeft--;
            resendOtpBtn.textContent = `Resend in ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                resendOtpBtn.disabled = false; // Re-enable the button
                resendOtpBtn.textContent = 'Resend';
            }
        }, 1000);
    };

    const handleSendOtp = () => {
        const email = document.getElementById('registerEmail').value;
        if (!email) {
            alert('Please enter your email address first.');
            return;
        }

        generatedOtp = '123456';
        alert('An OTP has been sent (for demo, it is 123456)');
        otpSection.classList.remove('hidden');
        startTimer(); // Start the timer
    };

    sendOtpBtn.addEventListener('click', handleSendOtp);
    resendOtpBtn.addEventListener('click', handleSendOtp);


    // --- AUTHENTICATION LOGIC ---
    const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];
    const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

    // Handle Registration
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const enteredOtp = document.getElementById('registerOtp').value;

        if (!generatedOtp) {
            alert('Please send and verify the OTP first.');
            return;
        }
        if (enteredOtp !== generatedOtp) {
            alert('Invalid OTP. Please try again.');
            return;
        }
        
        const users = getUsers();
        if (users.find(user => user.username === username)) {
            alert('Username already exists. Please choose another.');
            return;
        }

        users.push({ username, email, password });
        saveUsers(users);

        alert('Registration successful! Please log in.');
        container.classList.remove('active');
        registerForm.reset();
        otpSection.classList.add('hidden');
        clearInterval(timerInterval);
    });

    // Handle Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const user = getUsers().find(u => u.username === username && u.password === password);

        if (user) {
            sessionStorage.setItem('loggedInUser', username);
            window.location.href = 'index.html';
        } else {
            alert('Invalid username or password.');
        }
    });
});

