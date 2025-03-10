document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent form submission

        const formData = new FormData(form);
        const queryStringParams = [];

        // Add default key
        queryStringParams.push(`key=${encodeURIComponent("default")}`);

        formData.forEach((value, key) => {
            const trimmedValue = value.trim();
            if (trimmedValue !== "") {
                queryStringParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(trimmedValue)}`);
            }
        });

        const baseUrl = "https://manage.beyondmebtw.com/latestdata";
        const queryString = queryStringParams.join("&");
        const url = `${baseUrl}?${queryString}`;

        console.log("Constructed URL:", url);

    });
});
