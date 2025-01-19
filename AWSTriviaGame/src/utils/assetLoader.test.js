import { getAssetPath } from './assetLoader';

describe('AssetLoader', () => {
    test('returns correct path for assets', () => {
        expect(getAssetPath('images/test.png')).toBe('assets/images/test.png');
    });

    test('handles different asset types', () => {
        expect(getAssetPath('fonts/arcade.xml')).toBe('assets/fonts/arcade.xml');
        expect(getAssetPath('data/questions.json')).toBe('assets/data/questions.json');
    });
}); 