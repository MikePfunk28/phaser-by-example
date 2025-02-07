// Asset path configuration
const BASE_PATH = '/assets';

// Asset cache
const assetCache = new Map();

/**
 * Get the full path for an asset
 * @param {string} path - Relative path to the asset
 * @returns {string} Full path to the asset
 */
export function getAssetPath(path) {
    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullPath = `${BASE_PATH}${normalizedPath}`;
    console.log('Asset path requested:', { original: path, normalized: normalizedPath, full: fullPath });
    return fullPath;
}

/**
 * Load and cache an asset
 * @param {string} path - Path to the asset
 * @param {string} type - Type of asset (image, audio, json, etc.)
 * @returns {Promise} Promise that resolves with the loaded asset
 */
export function loadAsset(path, type) {
    const fullPath = getAssetPath(path);
    console.log('Loading asset:', { path, type, fullPath });

    // Check cache first
    if (assetCache.has(fullPath)) {
        console.log('Asset found in cache:', fullPath);
        return Promise.resolve(assetCache.get(fullPath));
    }

    // Load asset based on type
    return new Promise((resolve, reject) => {
        switch (type) {
            case 'image':
                loadImage(fullPath)
                    .then(asset => {
                        console.log('Image loaded successfully:', fullPath);
                        assetCache.set(fullPath, asset);
                        resolve(asset);
                    })
                    .catch(error => {
                        console.error('Failed to load image:', fullPath, error);
                        reject(error);
                    });
                break;

            case 'json':
                fetch(fullPath)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('JSON loaded successfully:', fullPath);
                        assetCache.set(fullPath, data);
                        resolve(data);
                    })
                    .catch(error => {
                        console.error('Failed to load JSON:', fullPath, error);
                        reject(error);
                    });
                break;

            case 'audio':
                loadAudio(fullPath)
                    .then(asset => {
                        console.log('Audio loaded successfully:', fullPath);
                        assetCache.set(fullPath, asset);
                        resolve(asset);
                    })
                    .catch(error => {
                        console.error('Failed to load audio:', fullPath, error);
                        reject(error);
                    });
                break;

            default:
                console.error('Unsupported asset type:', type);
                reject(new Error(`Unsupported asset type: ${type}`));
        }
    });
}

/**
 * Load an image asset
 * @param {string} path - Path to the image
 * @returns {Promise} Promise that resolves with the loaded image
 */
function loadImage(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
        img.src = path;
    });
}

/**
 * Load an audio asset
 * @param {string} path - Path to the audio file
 * @returns {Promise} Promise that resolves with the loaded audio
 */
function loadAudio(path) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => resolve(audio);
        audio.onerror = () => reject(new Error(`Failed to load audio: ${path}`));
        audio.src = path;
    });
}

/**
 * Clear the asset cache
 */
export function clearAssetCache() {
    assetCache.clear();
}

/**
 * Check if an asset is cached
 * @param {string} path - Path to the asset
 * @returns {boolean} True if the asset is cached
 */
export function isAssetCached(path) {
    const fullPath = getAssetPath(path);
    return assetCache.has(fullPath);
}

/**
 * Get a cached asset
 * @param {string} path - Path to the asset
 * @returns {*} The cached asset or null if not found
 */
export function getCachedAsset(path) {
    const fullPath = getAssetPath(path);
    return assetCache.get(fullPath) || null;
}

/**
 * Preload multiple assets
 * @param {Array} assets - Array of asset objects with path and type
 * @returns {Promise} Promise that resolves when all assets are loaded
 */
export function preloadAssets(assets) {
    const promises = assets.map(asset => loadAsset(asset.path, asset.type));
    return Promise.all(promises);
}

/**
 * Remove a specific asset from the cache
 * @param {string} path - Path to the asset
 */
export function removeFromCache(path) {
    const fullPath = getAssetPath(path);
    assetCache.delete(fullPath);
}

/**
 * Get the size of the asset cache
 * @returns {number} Number of cached assets
 */
export function getCacheSize() {
    return assetCache.size;
}

export default {
    getAssetPath,
    loadAsset,
    clearAssetCache,
    isAssetCached,
    getCachedAsset,
    preloadAssets,
    removeFromCache,
    getCacheSize
};
