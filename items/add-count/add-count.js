import { supabase } from "../../shared-modules/auth.js";

const searchInput = document.getElementById("search");
const searchResults = document.getElementById("search-results");
const selectedItemsElement = document.getElementById("selected-items");
const selectedItemsTitle = document.querySelector("main > h3");
const selectedHeader = document.getElementById("selected-header");
const saveButton = document.getElementById("save-count");
const message = document.getElementById("message");

let items = [];
let selectedItems = [];


// ---------- LOAD ITEMS ----------

async function loadItems() {

    const { data, error } = await supabase
        .from("items")
        .select("id, name, image_url")
        .order("name");

    if (error) {
        console.error(error);

        message.textContent =
            "Nepodařilo se načíst položky.";

        return;
    }

    items = data;
}


// ---------- SEARCH ----------

searchInput.addEventListener("input", () => {

    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();

    searchResults.innerHTML = "";

    if (!searchTerm) {
        return;
    }

    const results =
        items.filter(item =>
            item.name
                .toLowerCase()
                .includes(searchTerm)
        );

    results.forEach(item => {

        if (
            selectedItems.some(
                selected => selected.id === item.id
            )
        ) {
            return;
        }

        const element =
            document.createElement("div");


        // ---------- IMAGE ----------

        const image =
            document.createElement("img");

        if (item.image_url) {

            image.src =
                item.image_url;

            image.alt =
                item.name;

        } else {

            image.classList.add("hidden");
        }


        // ---------- NAME ----------

        const name =
            document.createElement("span");

        name.textContent =
            item.name;


        element.appendChild(image);
        element.appendChild(name);


        element.addEventListener("click", () => {

            addItem(item);

            searchInput.value = "";
            searchResults.innerHTML = "";
        });

        searchResults.appendChild(element);
    });
});


// ---------- ADD ITEM ----------

function addItem(item) {

    selectedItems.push({
        id: item.id,
        name: item.name,
        image_url: item.image_url,
        quantity: 0
    });

    displaySelectedItems();
}


// ---------- DISPLAY SELECTED ITEMS ----------

function displaySelectedItems() {

    const hasItems =
        selectedItems.length > 0;

    selectedItemsTitle.classList.toggle(
        "hidden",
        !hasItems
    );

    selectedHeader.classList.toggle(
        "hidden",
        !hasItems
    );

    saveButton.classList.toggle(
        "hidden",
        !hasItems
    );

    selectedItemsElement.innerHTML = "";

    selectedItems.forEach(item => {

        const container =
            document.createElement("div");


        // ---------- IMAGE ----------

        const image =
            document.createElement("img");

        if (item.image_url) {

            image.src =
                item.image_url;

            image.alt =
                item.name;

        } else {

            image.classList.add("hidden");
        }


        // ---------- NAME ----------

        const name =
            document.createElement("span");

        name.textContent =
            item.name;


        // ---------- QUANTITY ----------

        const quantityContainer =
            document.createElement("label");

        quantityContainer.classList.add(
            "quantity-container"
        );

        const quantity =
            document.createElement("input");

        quantity.type = "number";
        quantity.min = "0";
        quantity.value = item.quantity;

        quantity.addEventListener("input", () => {

            item.quantity =
                Number(quantity.value);
        });


        quantityContainer.appendChild(
            quantity
        );


        // ---------- REMOVE BUTTON ----------

        const removeButton =
            document.createElement("button");

        removeButton.type = "button";
        removeButton.textContent = "×";

        removeButton.addEventListener("click", () => {

            selectedItems =
                selectedItems.filter(
                    selected =>
                        selected.id !== item.id
                );

            displaySelectedItems();
        });


        container.appendChild(image);
        container.appendChild(name);
        container.appendChild(quantityContainer);
        container.appendChild(removeButton);

        selectedItemsElement.appendChild(container);
    });
}


// ---------- SAVE ----------

saveButton.addEventListener("click", async () => {

    message.textContent = "";

    if (selectedItems.length === 0) {

        message.textContent =
            "Nebyla vybrána žádná položka.";

        return;
    }


    // Create inventory count

    const {
        data: count,
        error: countError
    } = await supabase
        .from("stock_counts")
        .insert({})
        .select()
        .single();

    if (countError) {

        console.error(countError);

        message.textContent =
            "Nepodařilo se vytvořit inventuru.";

        return;
    }


    // Create count items

    const countItems =
        selectedItems.map(item => ({
            count_id: count.id,
            item_id: item.id,
            quantity: item.quantity
        }));


    const {
        error: itemsError
    } = await supabase
        .from("stock_count_items")
        .insert(countItems);

    if (itemsError) {

        console.error(itemsError);

        message.textContent =
            "Inventura byla vytvořena, ale položky se nepodařilo uložit.";

        return;
    }


    message.textContent =
        "Inventura byla uložena.";

    selectedItems = [];

    searchInput.value = "";
    searchResults.innerHTML = "";

    displaySelectedItems();
});


displaySelectedItems();
loadItems();