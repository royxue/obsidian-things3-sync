
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
	return line.replace(/^[\s#\-\[\]*]+/, '').trim();
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
