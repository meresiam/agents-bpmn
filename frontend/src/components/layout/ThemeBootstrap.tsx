const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem('aila-theme');
    var theme = (stored === 'dark' || stored === 'light') ? stored : 'light';
    document.documentElement.dataset.theme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export function ThemeBootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />;
}
