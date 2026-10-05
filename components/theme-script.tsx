const themeInitializationScript = `
(function () {
  try {
    var storedTheme = window.localStorage.getItem("fenjalbum-theme");
    var dark = storedTheme
      ? storedTheme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var root = document.documentElement;

    root.classList.toggle("dark", dark);
    root.classList.toggle("light", !dark);
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (_) {}
})();
`;

export function ThemeScript() {
  return (
    <script
      id="fenjalbum-theme-init"
      dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
    />
  );
}
