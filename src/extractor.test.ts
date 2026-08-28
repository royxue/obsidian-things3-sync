import { describe, it, expect } from 'vitest';
import { extractDate, extractTitle, extractTags, extractTarget, findCheckboxToggle } from './extractor';

describe('extractDate', () => {
	it('extracts an ISO-like date at the start of a line', () => {
		expect(extractDate('2026-06-22 Buy milk')).toBe('2026-06-22');
		expect(extractDate('2026/06/22 Buy milk')).toBe('2026/06/22');
	});

	it('returns empty string when there is no leading date', () => {
		expect(extractDate('Buy milk 2026-06-22')).toBe('');
		expect(extractDate('Buy milk')).toBe('');
	});
});

describe('extractTitle', () => {
	it('strips leading checkbox / list markers', () => {
		expect(extractTitle('- [ ] Buy milk')).toBe('Buy milk');
		expect(extractTitle('* Buy milk')).toBe('Buy milk');
		expect(extractTitle('# Heading')).toBe('Heading');
	});

	it('trims surrounding whitespace', () => {
		expect(extractTitle('   Buy milk   ')).toBe('Buy milk');
	});
});

describe('extractTags', () => {
	it('collects inline tags', () => {
		expect(extractTags('Buy milk #home #errand', '')).toBe('home,errand');
	});

	it('appends default tags', () => {
		expect(extractTags('Buy milk #home', 'work')).toBe('home,work');
	});

	it('returns empty string when there are no tags', () => {
		expect(extractTags('Buy milk', '')).toBe('');
	});
});

describe('extractTarget', () => {
	it('parses the todo id and a pending (to be completed) status', () => {
		const line = '- [ ] [Buy milk](things:///show?id=ABC123)';
		expect(extractTarget(line)).toEqual({ todoId: 'ABC123', completed: true });
	});

	it('treats a checked box as completed:false (about to reopen)', () => {
		const line = '- [x] [Buy milk](things:///show?id=ABC123)';
		expect(extractTarget(line)).toEqual({ todoId: 'ABC123', completed: false });
	});

	it('returns an empty id for a non-Things line', () => {
		expect(extractTarget('- [ ] Buy milk').todoId).toBe('');
	});
});

describe('findCheckboxToggle', () => {
	it('flips an unchecked box to checked', () => {
		const line = '- [ ] [Buy milk](things:///show?id=ABC123)';
		const toggle = findCheckboxToggle(line);
		expect(toggle).toEqual({ ch: 3, status: 'x' });
		expect(line.slice(0, 3) + 'x' + line.slice(4)).toBe('- [x] [Buy milk](things:///show?id=ABC123)');
	});

	it('flips a checked box back to unchecked', () => {
		expect(findCheckboxToggle('- [x] [Buy milk](things:///show?id=ABC123)')).toEqual({ ch: 3, status: ' ' });
	});

	it('handles an indented checkbox', () => {
		expect(findCheckboxToggle('\t\t- [ ] Buy milk')).toEqual({ ch: 5, status: 'x' });
	});

	it('returns null when the line has no checkbox', () => {
		expect(findCheckboxToggle('Buy milk')).toBeNull();
	});
});
