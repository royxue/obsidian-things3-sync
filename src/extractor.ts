
export function extractDate(line:string) {
	const regex = /^(19|20)\d\d([- /.])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])/
	let date = '';
	const res = line.match(regex);
	if (res) {
    date = res[0];
  }
	return date;
}

export function extractTitle(line: string) {
	// Strip a leading markdown list / checkbox / heading marker
	// (e.g. "- [ ] ", "* ", "# ") and surrounding whitespace.
	return line.replace(/^[\s#\-[\]*]+/, '').trim();
}

export function extractTags(line: string, setting_tags: string){
	const regex = /#([^\s]+)/gs
	const array = [...line.matchAll(regex)]
	const tag_array = array.map(x => x[1])
	if (setting_tags.length > 0) {
		tag_array.push(setting_tags);
	}
	line = line.replace(regex, '');
	const tags = tag_array.join(',')

	return tags;
}

export function extractTarget(line: string) {
	const idMatch = line.match(/id=(\w+)/);
	const todoId = idMatch != null ? idMatch[1] : '';

	// An unchecked box ("[ ]") means toggling will mark it completed.
	const statusMatch = line.match(/\[(.)\]/);
	const completed = statusMatch != null && statusMatch[1] === ' ';

	return { todoId, completed };
}

// Locate the first markdown checkbox on a line and the character it should be
// flipped to, or null when the line has no checkbox.
export function findCheckboxToggle(line: string): { ch: number, status: string } | null {
	const match = line.match(/\[(.)\]/);
	if (match == null || match.index === undefined) {
		return null;
	}
	return { ch: match.index + 1, status: match[1] === ' ' ? 'x' : ' ' };
}
