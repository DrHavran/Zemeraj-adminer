import { supabase } from "../../shared-modules/auth.js";

const itemId = new URLSearchParams(window.location.search).get("id");

const itemView = document.getElementById("item-view");
const itemEdit = document.getElementById("item-edit");

const editButton = document.getElementById("edit-button");
const saveButton = document.getElementById("save-button");

let item;

async function loadItem() {
    const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", itemId)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    item = data;

    document.getElementById("item-name").textContent = item.name;
    document.getElementById("purchase-price").textContent = item.purchase_price;
    document.getElementById("sale-price").textContent = item.sale_price;
    document.getElementById("item-active").textContent = item.active ? "Ano" : "Ne";

    const image = document.getElementById("item-image");

    if (item.image_url) {
        image.src = item.image_url;
        image.alt = item.name;
        image.classList.remove("hidden");
    } else {
        image.classList.add("hidden");
    }
}

editButton.addEventListener("click", () => {
    document.getElementById("edit-name").value = item.name;
    document.getElementById("edit-purchase-price").value = item.purchase_price;
    document.getElementById("edit-sale-price").value = item.sale_price;
    document.getElementById("edit-image-url").value = item.image_url ?? "";
    document.getElementById("edit-active").checked = item.active;

    itemView.classList.add("hidden");
    itemEdit.classList.remove("hidden");
});

saveButton.addEventListener("click", async () => {
    const { error } = await supabase
        .from("items")
        .update({
            name: document.getElementById("edit-name").value,
            purchase_price: document.getElementById("edit-purchase-price").value,
            sale_price: document.getElementById("edit-sale-price").value,
            image_url: document.getElementById("edit-image-url").value || null,
            active: document.getElementById("edit-active").checked
        })
        .eq("id", itemId);

    if (error) {
        console.error(error);
        return;
    }

    await loadItem();

    itemView.classList.remove("hidden");
    itemEdit.classList.add("hidden");
});

loadItem();