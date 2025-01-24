import { defineConfig } from 'vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    plugins: [
        visualizer({
            open: true,
            filename: 'dependency-graph.html',

        }),
    ],
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