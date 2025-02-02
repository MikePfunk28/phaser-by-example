import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'src',
    base: '/',
    publicDir: '../public',
    server: {
        port: 5173,
        host: true, // Listen on all addresses
        strictPort: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 5173
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html')
            }
        }
    }
}); 