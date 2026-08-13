export function urlEncode(line: string) {
	line = encodeURIComponent(line)
	return line
}

export function constructDeeplink(fileName: string, vaultName: string){
	const url = `obsidian://open?vault=${vaultName}&file=${fileName}`;
	return url;
}

// Permanent link resolved by the Advanced URI plugin via the note's
// frontmatter `id`, so it survives renames and moves.
export function constructAdvancedUriDeeplink(uid: string, vaultName: string){
	const url = `obsidian://advanced-uri?vault=${vaultName}&uid=${uid}`;
	return url;
}
