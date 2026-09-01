async function loadUser() {

    const response = await fetch("/api/me");

    if (!response.ok) {
        window.location.href = "/login.html";
        return;
    }

    const user = await response.json();

    document.getElementById("username").textContent =
        user.username;
}

async function loadMedia() {

    const response = await fetch("/api/media");

    if (!response.ok) return;

    const files = await response.json();

    const gallery =
        document.getElementById("gallery");

    gallery.innerHTML = "";

    const user =
        document.getElementById("username").textContent;

    files.forEach(filename => {

        const extension =
            filename.split(".").pop().toLowerCase();

        const url =
            `/media/${encodeURIComponent(user)}/${encodeURIComponent(filename)}`;

        const container =
            document.createElement("div");

        container.className = "media-item";

        if (
            ["jpg", "jpeg", "png", "gif", "webp"].includes(extension)
        ) {

            const img =
                document.createElement("img");

            img.src = url;

            container.appendChild(img);

        } else if (
            ["mp4", "webm", "mov"].includes(extension)
        ) {

            const video =
                document.createElement("video");

            video.src = url;
            video.controls = true;

            container.appendChild(video);
        }

        gallery.appendChild(container);
    });
}

document
    .getElementById("uploadButton")
    .addEventListener("click", async () => {

        const file =
            document.getElementById("media").files[0];

        if (!file) {
            alert("Choose a file first.");
            return;
        }

        const formData = new FormData();

        formData.append("media", file);

        document.getElementById("status").textContent =
            "Uploading...";

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {

            document.getElementById("status").textContent =
                "Uploaded!";

            document.getElementById("media").value = "";

            loadMedia();

        } else {

            document.getElementById("status").textContent =
                data.error || "Upload failed.";
        }
    });

document
    .getElementById("logout")
    .addEventListener("click", async () => {

        await fetch("/api/logout", {
            method: "POST"
        });

        window.location.href = "/login.html";
    });

loadUser();
loadMedia();
