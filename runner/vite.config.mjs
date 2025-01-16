import { defineConfig } from 'vite';
import path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const isProd = mode === 'production';

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
            sourcemap: !isProd,
            chunkSizeWarningLimit: 2000,
            outDir: 'dist',
            rollupOptions: {
                output: {
                    manualChunks: {
                        phaser: ['phaser']
                    }
                }
            },
            ...(isProd && {
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
                }
            })
        },
        optimizeDeps: {
            include: ['phaser']
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