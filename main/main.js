import { supabase } from "../shared-modules/auth.js";

async function loadClockedInPeople() {
    const peopleElement = document.getElementById("clocked-in-people");

    try {
        const {
            data: { session },
            error: sessionError
        } = await supabase.auth.getSession();

        if (!session) {
            throw new Error("Not logged in");
        }


        const response = await fetch(
            "https://ldlewyxyjvpnazgquxcv.supabase.co/functions/v1/swift-responder",
            {
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "apikey": "sb_publishable_lMFrNHzcuwsxA2nkN48GgA_BkmoPDUo"
                }
            }
        );

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(
                `Edge Function failed: ${response.status} - ${responseText}`
            );
        }

        const data = JSON.parse(responseText);


        // Display only names
        peopleElement.innerHTML = "";

        data.value.forEach(person => {
            const personElement = document.createElement("p");
            personElement.textContent = person.fullName;
            peopleElement.appendChild(personElement);
        });

    } catch (error) {
        peopleElement.textContent =
            "Nepodařilo se načíst data z Jibble.";
    }
}

loadClockedInPeople();