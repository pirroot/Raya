const THEME_INIT = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function ThemeInitScript() {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("Encountered a script tag")
      ) {
        return;
      }
      originalError(...args);
    };
  }

  return (
    <script
      id="theme-init"
      dangerouslySetInnerHTML={{ __html: THEME_INIT }}
    />
  );
}