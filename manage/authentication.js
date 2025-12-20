// authentication.js - Universal authentication system using cookies

class AuthenticationSystem {
    constructor() {
        this.cookieName = 'beyondme_auth';
        this.authKeyCookieName = 'beyondme_auth_key';
        this.cookieDomain = '.beyondmebtw.com';
        this.baseUrl = "https://manage.beyondmebtw.com/loginauth";
    }

    // Cookie utility functions
    setCookie(name, value, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${this.cookieDomain};SameSite=Lax`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${this.cookieDomain}`;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.getCookie(this.cookieName) === "true";
    }

    // Get stored auth key
    getAuthKey() {
        return this.getCookie(this.authKeyCookieName);
    }

    // Set authentication cookies
    setAuthentication(authKey) {
        this.setCookie(this.cookieName, "true");
        this.setCookie(this.authKeyCookieName, authKey);
    }

    // Clear authentication
    clearAuthentication() {
        this.deleteCookie(this.cookieName);
        this.deleteCookie(this.authKeyCookieName);
    }

    // Universal authentication check for protected pages
    checkAuthentication() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const isLoggedIn = this.isAuthenticated();
        
        // Define protected pages and their redirect targets
        const protectedPages = {
            'manage.html': 'https://manage.beyondmebtw.com/index.html',
            'minis.html': 'https://manage.beyondmebtw.com/index.html'
        };
        
        // Check if current page is protected and user is not authenticated
        if (protectedPages[currentPage] && !isLoggedIn) {
            // Show loading message briefly before redirect
            const authLoading = document.getElementById("auth-loading");
            if (authLoading) {
                authLoading.style.display = "block";
            }
            
            // Hide content containers while redirecting
            const contentContainer = document.getElementById("content-container");
            if (contentContainer) {
                contentContainer.style.display = "none";
            }
            
            // Redirect after a brief delay to the appropriate index page
            setTimeout(() => {
                window.location.href = protectedPages[currentPage];
            }, 1000);
            return false;
        }
        
        return isLoggedIn;
    }

    // Universal login function
    async handleLogin(password) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key: password
                })
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error("Authentication failed. Incorrect password.");
                }
                throw new Error(`Server responded with status: ${response.status}`);
            }

            await response.text();
            this.setAuthentication(password);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Logout function
    logout() {
        this.clearAuthentication();
        // Always redirect to manage.beyondmebtw.com index page
        window.location.href = 'https://manage.beyondmebtw.com/index.html';
    }

    // Initialize authentication system
    init() {
        // Handle page access first
        this.handlePageAccess();
        
        // Add logout functionality if logout button exists
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Fill password fields with stored auth key
        this.fillPasswordFields();
    }

    // Handle initial page access and authentication redirects
    handlePageAccess() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const isLoggedIn = this.isAuthenticated();
        
        // If on index page and already logged in, show navigation
        if (currentPage === 'index.html' && isLoggedIn) {
            const loginContainer = document.getElementById("login-container");
            const navContainer = document.getElementById("nav-container");
            
            if (loginContainer) loginContainer.style.display = "none";
            if (navContainer) navContainer.style.display = "flex";
            
            return true;
        }
        
        // For protected pages, check authentication
        if (currentPage === 'manage.html' || currentPage === 'minis.html') {
            return this.checkAuthentication();
        }
        
        return true;
    }

    // Fill password fields with stored auth key
    fillPasswordFields() {
        const authKey = this.getAuthKey();
        if (authKey) {
            const passwordFields = document.querySelectorAll('input[type="password"][name="key"]');
            passwordFields.forEach(field => {
                field.value = authKey;
            });
        }
    }

    // Check if we need to redirect based on authentication status
    setupIndexPageAuth() {
        const loginForm = document.getElementById("login-form");        
        const loginContainer = document.getElementById("login-container");
        const navContainer = document.getElementById("nav-container");
        const errorMessage = document.getElementById("error-message");

        // Check if user is already logged in
        const isLoggedIn = this.isAuthenticated();
        if (isLoggedIn) {
            this.showNavigation();
        }

        if (loginForm) {
            loginForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                
                const password = document.getElementById("login-password").value;
                const loginBtn = loginForm.querySelector('.login-btn');
                const originalText = loginBtn.textContent;
                
                loginBtn.textContent = 'Authenticating...';
                loginBtn.disabled = true;

                try {
                    await this.handleLogin(password);
                    if (errorMessage) errorMessage.style.display = 'none';
                    this.showNavigation();
                } catch (error) {
                    if (errorMessage) {
                        errorMessage.textContent = error.message;
                        errorMessage.style.display = 'block';
                    }
                    console.error(error);
                } finally {
                    loginBtn.textContent = originalText;
                    loginBtn.disabled = false;
                }
            });
        }

        // Add click handlers for navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isAuthenticated()) {
                    e.preventDefault();
                    alert("Please log in first.");
                    location.reload();
                }
            });
        });
    }

    showNavigation() {
        const loginContainer = document.getElementById("login-container");
        const navContainer = document.getElementById("nav-container");
        const logoutBtn = document.getElementById("logout-btn");

        if (loginContainer) loginContainer.style.display = "none";
        if (navContainer) navContainer.style.display = "flex";
        if (logoutBtn) logoutBtn.style.display = "block";
    }
}

// Create global authentication instance
window.authSystem = new AuthenticationSystem();