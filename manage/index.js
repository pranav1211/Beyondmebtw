document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent form submission

        const name = document.getElementById("name").value;
        const dateInput = document.getElementById("date").value;
        const excerpt = document.getElementById("excerpt").value;
        const thumbnail = document.getElementById("thumbnail").value;
        const key = document.getElementById("key").value;

        const dateObject = new Date(dateInput);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObject.toLocaleDateString('en-US', options);

        const params = new URLSearchParams({
            name,
            date: formattedDate, // Use the formatted date
            excerpt,
            thumbnail,
            key,
        });

        fetch(`/latestdata?${params.toString()}`)
            .then((response) => {
                if (response.ok) {
                    return response.text();
                } else {
                    throw new Error("Failed to send data");
                }
            })
            .then((message) => {
                alert(message); // Show success or error message
            })
            .catch((error) => {
                console.error(error);
                alert("An error occurred while sending the data.");
            });
    });
});