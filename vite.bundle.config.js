import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Inject built CSS into the JS bundle so one file is enough in the browser. */
function cssInjectedByJs() {
  return {
    name: 'css-injected-by-js',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      let css = '';
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'asset' && fileName.endsWith('.css')) {
          css += typeof chunk.source === 'string'
            ? chunk.source
            : new TextDecoder().decode(chunk.source);
          delete bundle[fileName];
        }
      }
      if (!css) return;
      const js = Object.values(bundle).find(
        (c) => c.type === 'chunk' && c.isEntry,
      );
      if (!js) return;
      const inject = `(function(){if(typeof document==="undefined")return;var s=document.createElement("style");s.setAttribute("data-table-soccer","1");s.textContent=${JSON.stringify(css)};document.head.appendChild(s);})();`;
      js.code = inject + js.code;
    },
  };
}

/** Single-file browser bundle that does not touch `document` at import time. */
export default defineConfig({
  plugins: [react(), cssInjectedByJs()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: true,
    outDir: 'dist-bundle',
    cssCodeSplit: false,
    modulePreload: false,
    // Inline welcome banner images into the JS so Edge does not need /img/*
    assetsInlineLimit: 400_000,
    lib: {
      entry: 'src/embed.jsx',
      name: 'TableSoccer',
      formats: ['iife'],
      fileName: () => 'football-dasti.bundle.js',
    },
    rollupOptions: {
      output: {
        exports: 'named',
        inlineDynamicImports: true,
        assetFileNames: 'football-dasti.bundle.[ext]',
      },
    },
  },
});
