const form = document.getElementById('login-form');
const message = document.getElementById('message');

form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'Logging in...';
    message.className = 'message';

    try {
        const response = await fetch('/api/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                username: form.username.value.trim(),
                password: form.password.value,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.detail || 'Login failed.');
        }

        sessionStorage.setItem('access_token', data.access);
        sessionStorage.setItem('username', data.user.username);
        window.location.href = '/dashboard/';
    } catch (error) {
        message.textContent = error.message;
        message.className = 'message error';
    }
});
