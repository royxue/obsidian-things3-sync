export function urlEncode(line: string) {
	line = encodeURIComponent(line)
	return line
}

export function constructDeeplink(fileName: string, vaultName: string){
	const url = `obsidian://open?vault=${vaultName}&file=${fileName}`;
	return url;
}
