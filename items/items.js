import { supabase } from "../shared-modules/auth.js";
import { redirectTo } from "../shared-modules/redirect.js";

const itemsList = document.getElementById("items-list");

const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .eq("active", true);

if (error) {
    console.error(error);
    itemsList.textContent = "Nepodařilo se načíst položky.";
} else {
    items.forEach(item => {
        const element = document.createElement("div");

        element.textContent = item.name;

        element.addEventListener("click", () => {
            redirectTo(`items/item/item.html?id=${item.id}`);
        });

        itemsList.appendChild(element);
    });
}

document.getElementById("add-stock").addEventListener("click", () => {
    redirectTo("items/add-stock/add-stock.html");
});

document.getElementById("add-count").addEventListener("click", () => {
    redirectTo("items/add-count/add-count.html");
});