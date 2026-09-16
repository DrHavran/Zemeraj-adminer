import { supabase } from "../shared-modules/auth.js";
import { redirectTo } from "../shared-modules/redirect.js";

const itemsList = document.getElementById("items-list");
const searchInput = document.getElementById("search");

let items = [];

async function loadItems() {
    const { data, error } = await supabase
        .from("items")
        .select("id, name")
        .eq("active", true)
        .order("name");

    if (error) {
        console.error(error);
        itemsList.textContent = "Nepodařilo se načíst položky.";
        return;
    }

    items = data;

    displayItems(items);
}

function displayItems(itemsToDisplay) {
    itemsList.innerHTML = "";

    if (itemsToDisplay.length === 0) {
        itemsList.textContent = "Žádné položky.";
        return;
    }

    itemsToDisplay.forEach(item => {
        const element = document.createElement("div");

        element.textContent = item.name;

        element.addEventListener("click", () => {
            redirectTo(`items/item/item.html?id=${item.id}`);
        });

        itemsList.appendChild(element);
    });
}

searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
    );

    displayItems(filteredItems);
});

document.getElementById("add-item").addEventListener("click", () => {
    redirectTo("items/add-item/add-item.html");
});

document.getElementById("add-stock").addEventListener("click", () => {
    redirectTo("items/add-stock/add-stock.html");
});

document.getElementById("add-count").addEventListener("click", () => {
    redirectTo("items/add-count/add-count.html");
});

loadItems();