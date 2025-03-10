document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

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
            })
            .catch((error) => {
                alert(`Error: ${error.message}`);
                console.error(error);
            });
    });

});


// const url = https://manage.beyondmebtw.com/latestdata?
//     name = ${ encodeURIComponent(name)}
// & date=${ encodeURIComponent(formattedDate) }
// & excerpt=${ encodeURIComponent(excerpt) }
// & thumbnail=${ encodeURIComponent(thumbnail) }
// & link=${ encodeURIComponent(link) }
// & formid=${ encodeURIComponent(formId) }
// & key=${ encodeURIComponent(key) };