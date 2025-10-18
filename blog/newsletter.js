document.getElementById('newsletterForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('.form-submit');
    const messageDiv = document.getElementById('formMessage');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';
    messageDiv.textContent = '';
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const recaptchaToken = grecaptcha.getResponse();
    
    if (!recaptchaToken) {
        messageDiv.textContent = 'Please complete the CAPTCHA';
        messageDiv.className = 'form-message error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe';
        return;
    }
    
    try {
        const response = await fetch('https://your-backend-api.com/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: fullName,
                email: email,
                recaptchaToken: recaptchaToken
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.textContent = 'Subscription successful! Check your email.';
            messageDiv.className = 'form-message success';
            document.getElementById('newsletterForm').reset();
            grecaptcha.reset();
        } else {
            messageDiv.textContent = data.message || 'Subscription failed. Please try again.';
            messageDiv.className = 'form-message error';
            grecaptcha.reset();
        }
    } catch (error) {
        messageDiv.textContent = 'An error occurred. Please try again.';
        messageDiv.className = 'form-message error';
        grecaptcha.reset();
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Subscribe';
});