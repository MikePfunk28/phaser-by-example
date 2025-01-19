import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'), // This sets '@' to point to the 'src' directory
            'gameobjects': path.resolve(__dirname, '../src/gameobjects'),
            'scenes': path.resolve(__dirname, '../src/scenes'),
            'utils': path.resolve(__dirname, '../src/utils'),
            'src': path.resolve(__dirname, '../src')
        }
    },
    base: '/assets/',
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2,
                drop_console: true
            },
            mangle: true,
            format: {
                comments: false
            }
        },
        assetsInlineLimit: 4096,
        chunkSizeWarningLimit: 1000,
        reportCompressedSize: false
    },
});
