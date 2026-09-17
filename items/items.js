import { supabase } from "../shared-modules/auth.js";
import { redirectTo } from "../shared-modules/redirect.js";

const itemsList = document.getElementById("items-list");
const searchInput = document.getElementById("search");

let items = [];

async function loadItems() {
    const { data, error } = await supabase
        .from("items")
        .select("id, name, image_url, sale_price")
        .eq("active", true)
        .order("name");

    if (error) {
        console.error(error);
        itemsList.textContent = "Nepodařilo se načíst položky.";
        return;
    }

    items = data;

    await loadStockData();

    displayItems(items);
}

async function loadStockData() {

    const itemIds = items.map(item => item.id);

    if (itemIds.length === 0) {
        return;
    }


    /* ---------- STOCK IN ---------- */

    const {
        data: stockIn,
        error: stockInError
    } = await supabase
        .from("stock_in")
        .select(`
            id,
            item_id,
            quantity,
            price_per_piece,
            date
        `)
        .in("item_id", itemIds)
        .order("date", { ascending: true })
        .order("id", { ascending: true });

    if (stockInError) {
        console.error(stockInError);
        return;
    }


    /* ---------- INVENTORY COUNTS ---------- */

    const {
        data: countItems,
        error: countError
    } = await supabase
        .from("stock_count_items")
        .select(`
            id,
            item_id,
            quantity,
            count_id,
            stock_counts (
                id,
                date
            )
        `)
        .in("item_id", itemIds);

    if (countError) {
        console.error(countError);
        return;
    }


    /*
     * Prepare stock data for every item.
     */
    items.forEach(item => {

        const itemStock =
            stockIn.filter(
                stock => stock.item_id === item.id
            );


        const itemCounts =
            countItems
                .filter(
                    count => count.item_id === item.id
                )
                .filter(
                    count => count.stock_counts
                );


        /* ---------- NÁKUPKA ---------- */

        const latestStock =
            itemStock.length > 0
                ? itemStock[itemStock.length - 1]
                : null;

        item.purchase_price =
            latestStock
                ? latestStock.price_per_piece
                : null;


        /* ---------- STAV ---------- */

        let latestCount = null;

        itemCounts.forEach(count => {

            const date =
                new Date(
                    count.stock_counts.date
                );

            if (
                !latestCount ||
                date > latestCount.date
            ) {
                latestCount = {
                    quantity: count.quantity,
                    date: date
                };
            }
        });


        if (!latestCount) {

            item.expected_quantity = null;

            return;
        }


        let expected =
            latestCount.quantity;


        itemStock.forEach(stock => {

            const stockDate =
                new Date(stock.date);

            if (
                stockDate > latestCount.date
            ) {
                expected += stock.quantity;
            }
        });


        item.expected_quantity =
            expected;
    });
}


function displayItems(itemsToDisplay) {

    itemsList.innerHTML = "";

    if (itemsToDisplay.length === 0) {
        itemsList.textContent = "Žádné položky.";
        return;
    }


    itemsToDisplay.forEach(item => {

        const element =
            document.createElement("div");


        /* ---------- IMAGE ---------- */

        const image =
            document.createElement("img");

        if (item.image_url) {

            image.src =
                item.image_url;

            image.alt =
                item.name;

        } else {

            image.classList.add(
                "hidden"
            );
        }


        /* ---------- NAME ---------- */

        const name =
            document.createElement("span");

        name.textContent =
            item.name;


        /* ---------- STOCK ---------- */

        const stock =
            document.createElement("span");

        stock.classList.add(
            "item-stock"
        );

        stock.textContent =
            item.expected_quantity !== null
                ? `${item.expected_quantity} ks`
                : "—";


        /* ---------- PURCHASE PRICE ---------- */

        const purchasePrice =
            document.createElement("span");

        purchasePrice.classList.add(
            "item-purchase-price"
        );

        purchasePrice.textContent =
            item.purchase_price !== null
                ? `${item.purchase_price} Kč`
                : "—";


        /* ---------- SALE PRICE ---------- */

        const salePrice =
            document.createElement("span");

        salePrice.classList.add(
            "item-sale-price"
        );

        salePrice.textContent =
            `${item.sale_price} Kč`;


        element.appendChild(image);
        element.appendChild(name);
        element.appendChild(purchasePrice);
        element.appendChild(salePrice);
        element.appendChild(stock);


        element.addEventListener("click", () => {

            redirectTo(
                `items/item/item.html?id=${item.id}`
            );
        });


        itemsList.appendChild(element);
    });
}


searchInput.addEventListener("input", () => {

    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    const filteredItems =
        items.filter(item =>
            item.name
                .toLowerCase()
                .includes(searchTerm)
        );


    displayItems(filteredItems);
});


document
    .getElementById("add-item")
    .addEventListener("click", () => {

        redirectTo(
            "items/add-item/add-item.html"
        );
    });


document
    .getElementById("add-stock")
    .addEventListener("click", () => {

        redirectTo(
            "items/add-stock/add-stock.html"
        );
    });


document
    .getElementById("add-count")
    .addEventListener("click", () => {

        redirectTo(
            "items/add-count/add-count.html"
        );
    });


loadItems();