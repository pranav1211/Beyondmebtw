document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent form submission

        const formData = new FormData(form);
        const queryStringParams = new URLSearchParams();

        formData.forEach((value, key) => {
            if (value.trim() !== "") {
                queryStringParams.append(key, value.trim());
            }
        });

        const queryString = queryStringParams.toString();
        const url = queryString ? `/api?${queryString}` : "/api";

        console.log("Constructed URL:", url);

        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log("Response Data:", data);
                // You can display the fetched data on the page or process it further
            })
            .catch((error) => {
                console.error("Error fetching data:", error.message);
                alert(error.message);
            });
    });
});
