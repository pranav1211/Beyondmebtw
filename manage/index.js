document.addEventListener("DOMContentLoaded", () => {
    // Get DOM elements
    const loginOverlay = document.getElementById("login-overlay");
    const contentArea = document.getElementById("content-area");
    const loginButton = document.getElementById("login-button");
    const loginKeyInput = document.getElementById("login-key");
    const loginError = document.getElementById("login-error");
    const logoutButton = document.getElementById("logout-button");
    const forms = document.querySelectorAll("form");
    const passwordInputs = document.querySelectorAll('input[type="password"][name="key"]');
    
    // Check if user is already logged in (from session storage)
    const storedKey = sessionStorage.getItem("authKey");
    if (storedKey) {
        // Auto-fill password fields and show content
        loginOverlay.style.display = "none";
        contentArea.style.display = "block";
        
        // Fill all password fields with the stored key
        passwordInputs.forEach(input => {
            input.value = storedKey;
        });
    }
    
    // Login button click handler
    loginButton.addEventListener("click", () => {
        const key = loginKeyInput.value.trim();
        
        if (!key) {
            loginError.textContent = "Please enter a password";
            return;
        }
        
        // Verify the key with the server
        verifyKey(key);
    });
    
    // Login on Enter key press
    loginKeyInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            loginButton.click();
        }
    });
    
    // Logout button click handler
    logoutButton.addEventListener("click", () => {
        // Clear session storage and reload page
        sessionStorage.removeItem("authKey");
        window.location.reload();
    });
    
    // Function to verify the key with the server
    function verifyKey(key) {
        // Create a special verification endpoint call
        fetch(`https://manage.beyondmebtw.com/verify?key=${encodeURIComponent(key)}`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Invalid password");
                }
            })
            .then(data => {
                if (data.success) {
                    // Store the key in session storage
                    sessionStorage.setItem("authKey", key);
                    
                    // Hide login, show content
                    loginOverlay.style.display = "none";
                    contentArea.style.display = "block";
                    
                    // Fill all password fields with the valid key
                    passwordInputs.forEach(input => {
                        input.value = key;
                    });
                } else {
                    loginError.textContent = "Invalid password";
                }
            })
            .catch(error => {
                loginError.textContent = error.message;
            });
    }
    
    // Form submission handling
    forms.forEach(form => {
        form.addEventListener("submit", (event) => {
            event.preventDefault(); // Prevent form submission

            const formData = new FormData(form);
            const queryStringParams = [];

            // Get the form's ID
            const formId = form.id;

            formData.forEach((value, key) => {
                const trimmedValue = value.trim();
                if (trimmedValue !== "") {
                    queryStringParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(trimmedValue)}`);
                }
            });

            // Add the formid parameter
            if (formId) {
                queryStringParams.push(`formid=${encodeURIComponent(formId)}`);
            }

            const baseUrl = "https://manage.beyondmebtw.com/latestdata";
            const queryString = queryStringParams.join("&");
            const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

            console.log("Constructed URL:", url);

            fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        if (response.status === 403) {
                            throw new Error("Authentication failed. Check your API key.");
                        }
                        throw new Error(`Server responded with status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(() => {
                    alert("Data updated successfully!");
                    form.reset();
                    
                    // Re-add the password to the form
                    const passwordInput = form.querySelector('input[type="password"][name="key"]');
                    if (passwordInput) {
                        passwordInput.value = sessionStorage.getItem("authKey") || "";
                    }
                })
                .catch((error) => {
                    alert(`Error: ${error.message}`);
                    console.error(error);
                });
        });
    });
});