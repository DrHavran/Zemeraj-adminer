import { supabase } from "../../shared-modules/auth.js";

const itemId = new URLSearchParams(window.location.search).get("id");

const itemView = document.getElementById("item-view");
const itemEdit = document.getElementById("item-edit");

const editButton = document.getElementById("edit-button");
const saveButton = document.getElementById("save-button");

const timeline = document.getElementById("timeline");
const expectedQuantity = document.getElementById("expected-quantity");

let item;
let purchasePriceHistory = [];
let salePriceHistory = [];


// ---------- LOAD ITEM ----------

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

    document.getElementById("item-name").textContent =
        item.name;

    document.getElementById("sale-price").textContent =
        `${item.sale_price} Kč`;

    document.getElementById("item-active").textContent =
        item.active ? "Ano" : "Ne";


    // ---------- IMAGE ----------

    const image =
        document.getElementById("item-image");

    if (item.image_url) {

        image.src = item.image_url;
        image.alt = item.name;

        image.classList.remove("hidden");

    } else {

        image.src = "";
        image.alt = "";

        image.classList.add("hidden");

    }


    await loadPriceHistory();

    await loadTimeline();
}


// ---------- LOAD PRICE HISTORY ----------

async function loadPriceHistory() {

    // ---------- PURCHASE PRICE FROM STOCK ----------

    const {
        data: stockIn,
        error: stockInError
    } = await supabase
        .from("stock_in")
        .select(`
            id,
            price_per_piece,
            date
        `)
        .eq("item_id", itemId)
        .order("date", { ascending: true })
        .order("id", { ascending: true });


    if (stockInError) {

        console.error(stockInError);

        return;
    }


    // Latest purchase price

    const latestStock =
        stockIn?.[stockIn.length - 1];

    const purchasePriceElement =
        document.getElementById("purchase-price");

    if (latestStock) {

        purchasePriceElement.textContent =
            `${latestStock.price_per_piece} Kč`;

    } else {

        purchasePriceElement.textContent =
            "—";

    }


    // ---------- SALE PRICE HISTORY ----------

    const {
        data: salePrices,
        error: saleError
    } = await supabase
        .from("sale_price_history")
        .select(`
            id,
            price,
            date
        `)
        .eq("item_id", itemId)
        .order("date", { ascending: true })
        .order("id", { ascending: true });


    if (saleError) {

        console.error(saleError);

        return;
    }

    salePriceHistory = salePrices ?? [];
}


// ---------- LOAD TIMELINE ----------

async function loadTimeline() {

    timeline.innerHTML = "Načítání...";


    // ---------- STOCK ADDITIONS ----------

    const {
        data: stockIn,
        error: stockInError
    } = await supabase
        .from("stock_in")
        .select(`
            id,
            quantity,
            price_per_piece,
            date
        `)
        .eq("item_id", itemId)
        .order("date", { ascending: true })
        .order("id", { ascending: true });


    if (stockInError) {

        console.error(stockInError);

        timeline.textContent =
            "Nepodařilo se načíst historii skladu.";

        return;
    }


    // ---------- INVENTORY COUNTS ----------

    const {
        data: countItems,
        error: countError
    } = await supabase
        .from("stock_count_items")
        .select(`
            id,
            quantity,
            count_id,
            stock_counts (
                id,
                date
            )
        `)
        .eq("item_id", itemId);


    if (countError) {

        console.error(countError);

        timeline.textContent =
            "Nepodařilo se načíst historii inventur.";

        return;
    }


    // ---------- CREATE EVENTS ----------

    const events = [];


    // Stock additions

    stockIn.forEach(stock => {

        events.push({
            type: "stock",
            id: stock.id,
            date: new Date(stock.date),
            quantity: stock.quantity,
            price: stock.price_per_piece
        });

    });


    // Inventory counts

    countItems.forEach(count => {

        if (!count.stock_counts) {
            return;
        }

        events.push({
            type: "count",
            id: count.id,
            date: new Date(count.stock_counts.date),
            quantity: count.quantity
        });

    });


    // Purchase price changes

    purchasePriceHistory.forEach(price => {

        events.push({
            type: "purchase-price",
            id: price.id,
            date: new Date(price.date),
            price: price.price
        });

    });


    // Sale price changes

    salePriceHistory.forEach(price => {

        events.push({
            type: "sale-price",
            id: price.id,
            date: new Date(price.date),
            price: price.price
        });

    });


    // ---------- SORT OLDEST → NEWEST ----------

    events.sort((a, b) => {

        const dateDifference =
            a.date - b.date;

        if (dateDifference !== 0) {
            return dateDifference;
        }

        return a.id - b.id;

    });


    displayTimeline(events);
}


// ---------- DISPLAY TIMELINE ----------

function displayTimeline(events) {

    timeline.innerHTML = "";


    if (events.length === 0) {

        timeline.textContent =
            "Žádná historie skladu.";

        expectedQuantity.textContent = "—";

        return;
    }


    // ---------- FIND LATEST INVENTORY ----------

    let latestCount = null;

    events.forEach(event => {

        if (event.type !== "count") {
            return;
        }

        if (
            !latestCount ||
            event.date > latestCount.date
        ) {
            latestCount = event;
        }

    });


    // ---------- CALCULATE EXPECTED STOCK ----------

    let expected = 0;

    if (latestCount) {

        expected = latestCount.quantity;

        events.forEach(event => {

            if (
                event.type === "stock" &&
                event.date > latestCount.date
            ) {
                expected += event.quantity;
            }

        });

    }


    expectedQuantity.textContent =
        latestCount
            ? expected
            : "—";


    // ---------- RENDER EVENTS ----------

    events.forEach(event => {

        const element =
            document.createElement("div");

        element.classList.add(
            "timeline-event"
        );


        // ---------- EVENT TYPE ----------

        if (event.type === "count") {

            element.classList.add(
                "timeline-count"
            );

        } else if (event.type === "stock") {

            element.classList.add(
                "timeline-stock"
            );

        } else {

            element.classList.add(
                "timeline-price"
            );

        }


        // ---------- MARKER ----------

        const marker =
            document.createElement("div");

        marker.classList.add(
            "timeline-marker"
        );


        // ---------- CONTENT ----------

        const content =
            document.createElement("div");

        content.classList.add(
            "timeline-content"
        );


        // ---------- DATE ----------

        const date =
            document.createElement("div");

        date.classList.add(
            "timeline-date"
        );

        date.textContent =
            formatDate(event.date);


        // ---------- DESCRIPTION ----------

        const description =
            document.createElement("div");

        description.classList.add(
            "timeline-description"
        );


        if (event.type === "count") {

            description.innerHTML =
                `<strong>Inventura</strong> · ${event.quantity} ks`;

        } else if (event.type === "stock") {

            description.innerHTML =
                `<strong>+${event.quantity} ks</strong>`;

        } else if (event.type === "purchase-price") {

            description.innerHTML =
                `<strong>Nákupní cena</strong> → ${event.price} Kč`;

        } else if (event.type === "sale-price") {

            description.innerHTML =
                `<strong>Prodejní cena</strong> → ${event.price} Kč`;

        }


        content.appendChild(date);
        content.appendChild(description);


        // ---------- STOCK PURCHASE PRICE ----------

        if (event.type === "stock") {

            const price =
                document.createElement("div");

            price.classList.add(
                "timeline-price"
            );

            price.textContent =
                `${event.price} Kč / ks`;

            content.appendChild(price);

        }


        element.appendChild(marker);
        element.appendChild(content);

        timeline.appendChild(element);

    });
}


// ---------- DATE ----------

function formatDate(date) {

    return date.toLocaleDateString(
        "cs-CZ",
        {
            day: "numeric",
            month: "numeric",
            year: "numeric"
        }
    );

}


// ---------- EDIT ----------

editButton.addEventListener("click", () => {

    document.getElementById("edit-name").value =
        item.name;

    document.getElementById("edit-sale-price").value =
        item.sale_price;

    document.getElementById("edit-image-url").value =
        item.image_url ?? "";

    document.getElementById("edit-active").checked =
        item.active;


    // Latest purchase price from stock

    const purchasePriceElement =
        document.getElementById(
            "purchase-price"
        );

    const purchasePriceInput =
        document.getElementById(
            "edit-purchase-price"
        );

    if (purchasePriceInput) {

        const currentPurchasePrice =
            purchasePriceElement.textContent
                .replace(" Kč", "")
                .trim();

        purchasePriceInput.value =
            currentPurchasePrice === "—"
                ? ""
                : currentPurchasePrice;

    }


    itemView.classList.add("hidden");
    itemEdit.classList.remove("hidden");

});


// ---------- SAVE ----------

saveButton.addEventListener("click", async () => {

    const newName =
        document.getElementById("edit-name").value;

    const newSalePrice =
        Number(
            document.getElementById("edit-sale-price").value
        );

    const newImageUrl =
        document.getElementById("edit-image-url").value || null;

    const newActive =
        document.getElementById("edit-active").checked;


    // ---------- PURCHASE PRICE ----------

    const purchasePriceInput =
        document.getElementById(
            "edit-purchase-price"
        );

    let newPurchasePrice = null;

    if (purchasePriceInput) {

        newPurchasePrice =
            Number(purchasePriceInput.value);

    }


    // ---------- UPDATE ITEM ----------

    const { error } = await supabase
        .from("items")
        .update({
            name: newName,
            sale_price: newSalePrice,
            image_url: newImageUrl,
            active: newActive
        })
        .eq("id", itemId);


    if (error) {

        console.error(error);

        return;
    }


    // ---------- PURCHASE PRICE CHANGED ----------

    const latestPurchasePrice =
        purchasePriceHistory[
            purchasePriceHistory.length - 1
        ];

    const oldPurchasePrice =
        latestPurchasePrice
            ? Number(latestPurchasePrice.price)
            : null;


    if (
        newPurchasePrice !== null &&
        (
            oldPurchasePrice === null ||
            oldPurchasePrice !== newPurchasePrice
        )
    ) {

        const {
            error: purchasePriceError
        } = await supabase
            .from("purchase_price_history")
            .insert({
                item_id: itemId,
                price: newPurchasePrice
            });


        if (purchasePriceError) {

            console.error(
                purchasePriceError
            );

            return;
        }

    }


    // ---------- SALE PRICE CHANGED ----------

    if (
        Number(item.sale_price) !==
        newSalePrice
    ) {

        const {
            error: salePriceError
        } = await supabase
            .from("sale_price_history")
            .insert({
                item_id: itemId,
                price: newSalePrice
            });


        if (salePriceError) {

            console.error(
                salePriceError
            );

            return;
        }

    }


    // ---------- RELOAD ----------

    await loadItem();

    itemView.classList.remove("hidden");
    itemEdit.classList.add("hidden");

});


// ---------- INITIAL LOAD ----------

loadItem();