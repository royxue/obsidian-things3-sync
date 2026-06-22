import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTodo, updateTodo, createTodoFromNote } from './things3';

let lastUrl: string;

beforeEach(() => {
	lastUrl = '';
	vi.stubGlobal('window', { open: (url: string) => { lastUrl = url; } });
});

describe('createTodo', () => {
	it('percent-encodes the title, tags and deep link', () => {
		createTodo(
			{ title: 'Buy milk & eggs', tags: 'home,errand', date: '2026-06-22' },
			'obsidian://open?vault=My Vault&file=Note'
		);
		expect(lastUrl).toContain('title=Buy%20milk%20%26%20eggs');
		expect(lastUrl).toContain('tags=home%2Cerrand');
		expect(lastUrl).toContain('when=2026-06-22');
		expect(lastUrl).toContain('notes=obsidian%3A%2F%2Fopen%3Fvault%3DMy%20Vault%26file%3DNote');
		expect(lastUrl).toContain('x-success=obsidian%3A%2F%2Fthings-sync-id');
	});

	it('omits empty parameters', () => {
		createTodo({ title: 'Plain', tags: '', date: '' }, 'obsidian://open');
		expect(lastUrl).not.toContain('tags=');
		expect(lastUrl).not.toContain('when=');
	});
});

describe('createTodoFromNote', () => {
	it('encodes the title (previously left raw)', () => {
		createTodoFromNote({ title: 'My Note & Stuff', tags: '', date: '' }, 'obsidian://open');
		expect(lastUrl).toContain('title=My%20Note%20%26%20Stuff');
		expect(lastUrl).not.toContain('x-success');
	});
});

describe('updateTodo', () => {
	it('serializes the boolean completed flag', () => {
		updateTodo('ABC123', true, 'tok en');
		expect(lastUrl).toContain('id=ABC123');
		expect(lastUrl).toContain('completed=true');
		expect(lastUrl).toContain('auth-token=tok%20en');
	});
});
