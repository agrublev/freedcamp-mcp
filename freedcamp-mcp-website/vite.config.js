import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static site generation for the Freedcamp MCP docs site.
// The design (Freedcamp MCP Docs.dc.html) is a single long page with anchor
// navigation, so we pre-render exactly one index.html with all content in
// the HTML source (fully indexable), plus sitemap/robots/llms.txt.
export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        target: 'es2020',
        cssCodeSplit: false,
        assetsInlineLimit: 0,
        rollupOptions: {
            output: {
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
        },
    },
    server: {
        port: 5174,
        strictPort: false,
    },
    ssgOptions: {
        script: 'defer',
        formatting: 'minify',
        entry: 'src/main.jsx',
        beastiesOptions: false,
    },
});
