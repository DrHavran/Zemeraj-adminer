import { supabase } from "../../shared-modules/auth.js";

const form = document.getElementById("add-item-form");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";

    const name = document.getElementById("name").value;
    const purchasePrice = document.getElementById("purchase-price").value;
    const salePrice = document.getElementById("sale-price").value;
    const imageUrl = document.getElementById("image-url").value;
    const active = document.getElementById("active").checked;

    const { error } = await supabase
        .from("items")
        .insert({
            name: name,
            purchase_price: purchasePrice,
            sale_price: salePrice,
            image_url: imageUrl || null,
            active: active
        });

    if (error) {
        console.error(error);
        message.textContent = "Nepodařilo se přidat položku.";
        return;
    }

    message.textContent = "Položka byla přidána.";

    form.reset();

    document.getElementById("active").checked = true;
});