document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const dateInput = document.getElementById("date").value;
        const excerpt = document.getElementById("excerpt").value;
        const thumbnail = document.getElementById("thumbnail").value;
        const key = document.getElementById("key").value;

        // Format the date
        const dateObject = new Date(dateInput);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObject.toLocaleDateString('en-US', options);

        // Construct the URL with all parameters
        const url = `http://64.227.143.61/latestdata?name=${encodeURIComponent(name)}&date=${encodeURIComponent(formattedDate)}&excerpt=${encodeURIComponent(excerpt)}&thumbnail=${encodeURIComponent(thumbnail)}&key=${encodeURIComponent(key)}`;
        window.location = url

    });
});
