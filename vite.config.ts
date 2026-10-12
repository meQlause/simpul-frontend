export default {
  server: {
    proxy: { '/api': 'http://127.0.0.1:3000' },
    // Compile the app's entry before the first visitor asks, so a cold start (CI) serves it at once.
    warmup: { clientFiles: ['./src/main.tsx', './src/app/router.tsx'] },
  },
  // Pre-bundle every dependency the sources import up front: finding one late reloads the page.
  optimizeDeps: { entries: ['index.html', 'src/**/*.{ts,tsx}'] },
};
