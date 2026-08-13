import { describe, it, expect } from 'vitest';
import { urlEncode, constructDeeplink, constructAdvancedUriDeeplink } from './url';

describe('constructDeeplink', () => {
	it('builds an obsidian://open link with vault and file', () => {
		expect(constructDeeplink(urlEncode('My Note'), urlEncode('My Vault')))
			.toBe('obsidian://open?vault=My%20Vault&file=My%20Note');
	});
});

describe('constructAdvancedUriDeeplink', () => {
	it('builds an advanced-uri link with vault and uid', () => {
		expect(constructAdvancedUriDeeplink('b8f3-42ab', urlEncode('My Vault')))
			.toBe('obsidian://advanced-uri?vault=My%20Vault&uid=b8f3-42ab');
	});
});
