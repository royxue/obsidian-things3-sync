
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
	const regex = /[^#\s\-\[\]*](.*)/gs
	const content = line.match(regex);
	let title = '';
	if (content != null) {
		title = content[0]
	}

	return title;
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
	const regexId = /id=(\w+)/
	const id = line.match(regexId);
	let todoId: string;
	if (id != null) {
		todoId = id[1];
	} else {
		todoId = ''
	}

	const regexStatus = /\[(.)\]/
	const status = line.match(regexStatus)
	let afterStatus: string;
	if (status && status[1] == ' ') {
		afterStatus = 'true'
	} else {
		afterStatus = 'false'
	}

	return  {todoId, afterStatus}
}
