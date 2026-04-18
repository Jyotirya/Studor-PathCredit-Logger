const form = document.getElementById('register-form');
const message = document.getElementById('message');

form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'Creating account...';
    message.className = 'message';

    const payload = {
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
    };

    try {
        const response = await fetch('/api/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
            const firstError = data?.username?.[0] || data?.password?.[0] || data?.detail || 'Registration failed.';
            throw new Error(firstError);
        }

        message.textContent = 'Registration successful. Redirecting to login...';
        message.className = 'message success';
        form.reset();
        setTimeout(() => {
            window.location.href = '/login/';
        }, 900);
    } catch (error) {
        message.textContent = error.message;
        message.className = 'message error';
    }
});
