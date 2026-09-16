const isProduction = window.location.hostname === "drhavran.github.io";

const basePath = isProduction
    ? "/Zemeraj-adminer"
    : "";

export function redirectTo(page) {
    window.location.href = basePath + "/" + page;
}