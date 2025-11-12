// modules/contentForms.js - Content form handling

import { loadLatestData } from './dataLoader.js';

export function setupContentForms() {
    const forms = document.querySelectorAll("#content-container form:not(.blog-form)");

    forms.forEach(form => {
        // Skip blog forms
        if (form.classList.contains('blog-form') || form.id === 'blog-form') {
            return;
        }

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const formData = new FormData(form);
            const formDataObject = {};
            const formId = form.id;

            formData.forEach((value, key) => {
                const trimmedValue = value.trim();
                if (trimmedValue !== "") {
                    formDataObject[key] = trimmedValue;
                }
            });

            if (formId) {
                formDataObject.formid = formId;
            }

            const baseUrl = "https://manage.beyondmebtw.com/latestdata";

            try {
                const response = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formDataObject)
                });

                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error("Authentication failed. Check your API key.");
                    }
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                await response.text();
                alert("Data updated successfully!");

                const authKey = window.authSystem.getAuthKey();
                form.reset();
                const passwordField = form.querySelector('input[name="key"]');
                if (passwordField) {
                    passwordField.value = authKey;
                }

                loadLatestData();
            } catch (error) {
                alert(`Error: ${error.message}`);
                console.error(error);
            }
        });
    });
}
