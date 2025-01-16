import Player from '/src/gameobjects/player';
import Generator from '/src/gameobjects/generator';
import * as Phaser from 'phaser';
import SceneOrderManager from '/src/utils/SceneOrderManager';

// Helper function to handle asset paths in both dev and production
export function getAssetPath(path) {
    // Remove leading slash if present
    path = path.startsWith('/') ? path.substring(1) : path;

    // Check if we're in development mode (you can adjust this check based on your build setup)
    const isDev = process.env.NODE_ENV === 'development';

    // In development, use /public, in production use /assets
    const baseDir = isDev ? '/public' : '';

    // Ensure path starts with /assets
    if (!path.startsWith('assets/')) {
        path = 'assets/' + path;
    }

    return `${baseDir}/${path}`;
}
