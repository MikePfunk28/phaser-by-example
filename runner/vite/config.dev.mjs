import { defineConfig } from 'vite'; // Importing the defineConfig function from Vite
import path from 'path'; // Importing the path module from Node.js

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'), // This sets '@' to point to the 'src' directory
            'gameobjects': path.resolve(__dirname, './src/gameobjects'),
            'scenes': path.resolve(__dirname, './src/scenes'),
            'utils': path.resolve(__dirname, './src/utils'),
            'src': path.resolve(__dirname, '../src')
        }
    },
    base: '/assets/',
    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    },
    server: {
        port: 8080,
        open: true,
        cors: true,
        hmr: {
            overlay: true
        }
    },
    optimizeDeps: {
        exclude: ['phaser']
    }
});