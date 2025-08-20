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
            'minis.html': 'https://minis.beyondmebtw.com/backend/minis.html'
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
        // Redirect to appropriate index page based on current domain
        const hostname = window.location.hostname;
        if (hostname.includes('manage.beyondmebtw.com')) {
            window.location.href = 'https://manage.beyondmebtw.com/index.html';
        } else if (hostname.includes('minis.beyondmebtw.com')) {
            window.location.href = 'https://manage.beyondmebtw.com/index.html';
        } else {
            window.location.href = 'index.html';
        }
    }

    // Initialize authentication system
    init() {
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
        
        return this.checkAuthentication();
    }
}

// Create global authentication instance
window.authSystem = new AuthenticationSystem();