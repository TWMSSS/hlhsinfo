var _darkCSS = document.querySelectorAll(`link[rel=stylesheet][media*=prefers-color-scheme][media*="dark"]`);
var _lightCSS = document.querySelectorAll(`link[rel=stylesheet][media*=prefers-color-scheme][media*="light"]`);

function updateThemeMode(mode) {
    if (mode === "light") {
        _lightCSS.forEach((link) => {
            link.media = "all";
            link.disabled = false;
        });
        _darkCSS.forEach((link) => {
            link.media = "not all";
            link.disabled = true;
        });
        localStorage.setItem("theme", "light");
        document.querySelector(":root").classList.add("light");
    } else {
        _darkCSS.forEach((link) => {
            link.media = "all";
            link.disabled = false;
        });
        _lightCSS.forEach((link) => {
            link.media = "not all";
            link.disabled = true;
        });
        localStorage.setItem("theme", "dark");
        document.querySelector(":root").classList.remove("light");
    }
}