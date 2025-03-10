document.addEventListener("DOMContentLoaded", () => {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const formId = form.id;
            const formData = new FormData(form);
            const name = formData.get("name");
            const dateInput = formData.get("date");
            const excerpt = formData.get("excerpt");
            const thumbnail = formData.get("thumbnail");
            const link = formData.get("link")
            const key = formData.get("key");

            const dateObject = new Date(dateInput);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = dateObject.toLocaleDateString('en-US', options);

            const url = `https://manage.beyondmebtw.com/latestdata?
            name=${encodeURIComponent(name)}
            &date=${encodeURIComponent(formattedDate)}
            &excerpt=${encodeURIComponent(excerpt)}
            &thumbnail=${encodeURIComponent(thumbnail)}
            &link=${encodeURIComponent(link)}
            &formid=${encodeURIComponent(formId)}
            &key=${encodeURIComponent(key)}`;

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
                })
                .catch((error) => {
                    alert(`Error: ${error.message}`);
                    console.error(error);
                });
        });
    });
});
