import { supabase } from "../../shared-modules/auth.js";

const searchInput = document.getElementById("search");
const searchResults = document.getElementById("search-results");
const selectedItemsElement = document.getElementById("selected-items");
const saveButton = document.getElementById("save-stock");
const message = document.getElementById("message");

let items = [];
let selectedItems = [];

// Load all items once
async function loadItems() {
    const { data, error } = await supabase
        .from("items")
        .select("id, name")
        .order("name");

    if (error) {
        console.error(error);
        message.textContent = "Nepodařilo se načíst položky.";
        return;
    }

    items = data;
}

// Search locally
searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase().trim();

    searchResults.innerHTML = "";

    if (!searchTerm) {
        return;
    }

    const results = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
    );

    results.forEach(item => {
        // Don't show already selected items
        if (selectedItems.some(selected => selected.id === item.id)) {
            return;
        }

        const element = document.createElement("div");

        element.textContent = item.name;

        element.addEventListener("click", () => {
            addItem(item);

            searchInput.value = "";
            searchResults.innerHTML = "";
        });

        searchResults.appendChild(element);
    });
});

function addItem(item) {
    selectedItems.push({
        id: item.id,
        name: item.name,
        quantity: 1,
        pricePerPiece: 0
    });

    displaySelectedItems();
}

function displaySelectedItems() {
    selectedItemsElement.innerHTML = "";

    selectedItems.forEach(item => {
        const container = document.createElement("div");

        const name = document.createElement("span");
        name.textContent = item.name;

        const quantity = document.createElement("input");
        quantity.type = "number";
        quantity.min = "1";
        quantity.value = item.quantity;
        quantity.placeholder = "Množství";

        quantity.addEventListener("input", () => {
            item.quantity = Number(quantity.value);
        });

        const price = document.createElement("input");
        price.type = "number";
        price.min = "0";
        price.step = "0.01";
        price.value = item.pricePerPiece;
        price.placeholder = "Cena / ks";

        price.addEventListener("input", () => {
            item.pricePerPiece = Number(price.value);
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";

        removeButton.addEventListener("click", () => {
            selectedItems = selectedItems.filter(
                selected => selected.id !== item.id
            );

            displaySelectedItems();
        });

        container.appendChild(name);
        container.appendChild(quantity);
        container.appendChild(price);
        container.appendChild(removeButton);

        selectedItemsElement.appendChild(container);
    });
}

saveButton.addEventListener("click", async () => {
    message.textContent = "";

    if (selectedItems.length === 0) {
        message.textContent = "Nebyla vybrána žádná položka.";
        return;
    }

    // Check values
    for (const item of selectedItems) {
        if (item.quantity < 1 || item.pricePerPiece < 0) {
            message.textContent =
                "Zkontrolujte množství a cenu u všech položek.";
            return;
        }
    }

    const stockItems = selectedItems.map(item => ({
        item_id: item.id,
        quantity: item.quantity,
        price_per_piece: item.pricePerPiece
    }));

    const { error } = await supabase
        .from("stock_in")
        .insert(stockItems);

    if (error) {
        console.error(error);
        message.textContent = "Nepodařilo se uložit sklad.";
        return;
    }

    message.textContent = "Sklad byl uložen.";

    selectedItems = [];
    searchInput.value = "";
    searchResults.innerHTML = "";
    displaySelectedItems();
});

loadItems();