export function urlEncode(line: string) {
	line = encodeURIComponent(line)
	return line
}

export function constructDeeplink(fileName: string, vaultName: string){
	const url = `obsidian://open?vault=${vaultName}&file=${fileName}`;
	return url;
}

export function createTodo(todo: TodoInfo, deepLink: string){
	const url = `things:///add?title=${todo.title}&notes=${deepLink}&when=${todo.date}&x-success=obsidian://things-sync-id&tags=${todo.tags}`;
	window.open(url);
}

export function updateTodo(todoId: string, completed: string, authToken: string){
	const url = `things:///update?id=${todoId}&completed=${completed}&auth-token=${authToken}`;
	window.open(url);
}