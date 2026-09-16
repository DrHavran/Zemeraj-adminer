import { supabase } from "./shared-modules/supabase.js";
import { redirectTo } from "./shared-modules/redirect.js";

const form = document.getElementById("login-form");
const errorMessage = document.getElementById("login-error");

const { data: { session } } = await supabase.auth.getSession();

if (session) {
    redirectTo("main/main.html");
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    errorMessage.textContent = "";

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        errorMessage.textContent = "Nesprávný e-mail nebo heslo.";
        return;
    }

    redirectTo("main/main.html");
});