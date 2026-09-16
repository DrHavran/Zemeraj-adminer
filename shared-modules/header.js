import { redirectTo } from "./redirect.js";

async function loadHeader() {
    const header = document.getElementById("header");
    if (!header) return;

    const basePath = window.location.hostname === "drhavran.github.io"
        ? "/Zemeraj-adminer"
        : "";

    const isProduction = window.location.hostname === "drhavran.github.io";

    const file = isProduction
        ? basePath + "/components/header.html"
        : basePath + "/components/headerDebug.html";

    const response = await fetch(file);
    header.innerHTML = await response.text();

    document.getElementById("home-link").addEventListener("click", (event) => {
        event.preventDefault();
        redirectTo("main/main.html");
    });

    document.getElementById("items-link").addEventListener("click", (event) => {
        event.preventDefault();
        redirectTo("items/items.html");
    });
}

loadHeader();