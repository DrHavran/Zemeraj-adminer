import { supabase } from "../../shared-modules/auth.js";

const searchInput = document.getElementById("search");
const searchResults = document.getElementById("search-results");
const selectedItemsElement = document.getElementById("selected-items");
const saveButton = document.getElementById("save-count");
const message = document.getElementById("message");

let items = [];
let selectedItems = [];

// Load all item names once
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

    // Don't show anything when search is empty
    if (!searchTerm) {
        return;
    }

    const results = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
    );

    results.forEach(item => {
        // Don't show items that are already selected
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
        quantity: 0
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
        quantity.min = "0";
        quantity.value = item.quantity;

        quantity.addEventListener("input", () => {
            item.quantity = Number(quantity.value);
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

    // Create inventory count
    const { data: count, error: countError } = await supabase
        .from("stock_counts")
        .insert({})
        .select()
        .single();

    if (countError) {
        console.error(countError);
        message.textContent = "Nepodařilo se vytvořit inventuru.";
        return;
    }

    // Create count items
    const countItems = selectedItems.map(item => ({
        count_id: count.id,
        item_id: item.id,
        quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
        .from("stock_count_items")
        .insert(countItems);

    if (itemsError) {
        console.error(itemsError);
        message.textContent =
            "Inventura byla vytvořena, ale položky se nepodařilo uložit.";
        return;
    }

    message.textContent = "Inventura byla uložena.";

    selectedItems = [];
    searchInput.value = "";
    searchResults.innerHTML = "";
    displaySelectedItems();
});

loadItems();