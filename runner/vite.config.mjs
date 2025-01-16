import { defineConfig } from 'vite';
import path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    return {
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                'gameobjects': path.resolve(__dirname, './src/gameobjects'),
                'scenes': path.resolve(__dirname, './src/scenes'),
                'utils': path.resolve(__dirname, './src/utils')
            }
        },
        base: env.VITE_BASE_URL || '/',
        build: {
            chunkSizeWarningLimit: 2000,
            outDir: 'dist',
            rollupOptions: {
                external: ['phaser'],
                output: {
                    globals: {
                        phaser: 'Phaser'
                    }
                }
            }
        },
        optimizeDeps: {
            exclude: ['phaser']
        },
        server: {
            port: 8080,
            open: true,
            hmr: {
                overlay: true
            }
        },
        define: {
            'CANVAS_RENDERER': JSON.stringify(true),
            'WEBGL_RENDERER': JSON.stringify(true)
        }
    };
});