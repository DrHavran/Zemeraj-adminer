import { supabase } from "../../shared-modules/auth.js";

const form = document.getElementById("add-item-form");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";

    const name = document.getElementById("name").value;
    const purchasePrice =
        document.getElementById("purchase-price").value;
    const salePrice =
        document.getElementById("sale-price").value;
    const imageUrl =
        document.getElementById("image-url").value;
    const active =
        document.getElementById("active").checked;


    // ---------- CREATE ITEM ----------

    const {
        data: item,
        error: itemError
    } = await supabase
        .from("items")
        .insert({
            name: name,
            purchase_price: purchasePrice,
            sale_price: salePrice,
            image_url: imageUrl || null,
            active: active
        })
        .select()
        .single();


    if (itemError) {
        console.error(itemError);

        message.textContent =
            "Nepodařilo se přidat položku.";

        return;
    }


    // ---------- CREATE INITIAL SALE PRICE ----------

    const {
        error: priceError
    } = await supabase
        .from("sale_price_history")
        .insert({
            item_id: item.id,
            price: salePrice
        });


    if (priceError) {
        console.error(priceError);

        message.textContent =
            "Položka byla přidána, ale nepodařilo se uložit historii prodejní ceny.";

        return;
    }


    // ---------- SUCCESS ----------

    message.textContent =
        "Položka byla přidána.";

    form.reset();

    document.getElementById("active").checked = true;
});