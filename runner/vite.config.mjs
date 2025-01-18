import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            'gameobjects': path.resolve(__dirname, './src/gameobjects'),
            'scenes': path.resolve(__dirname, './src/scenes'),
            'utils': path.resolve(__dirname, './src/utils')
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    },
    optimizeDeps: {
        include: ['phaser']
    }
});