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

        // Use domain name instead of IP address
        const url = `https://manage.beyondmebtw.com/latestdata?name=${encodeURIComponent(name)}&date=${encodeURIComponent(formattedDate)}&excerpt=${encodeURIComponent(excerpt)}&thumbnail=${encodeURIComponent(thumbnail)}&key=${encodeURIComponent(key)}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error("Authentication failed. Check your API key.");
                    }
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                alert("Data updated successfully!");
                // Optionally clear the form
                form.reset();
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
                console.error(error);
            });
    });
});