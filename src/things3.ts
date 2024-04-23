export interface TodoInfo {
	title: string,
	tags: string,
	date: string
}

export function createTodo(todo: TodoInfo, deepLink: string){
	const title = todo.title.replace(/ /g, '%20').replace(/&/g, '%26');
	const url = `things:///add?title=${title}&notes=${deepLink}&when=${todo.date}&x-success=obsidian://things-sync-id&tags=${todo.tags}`;
	window.open(url);
}

export function updateTodo(todoId: string, completed: string, authToken: string){
	const url = `things:///update?id=${todoId}&completed=${completed}&auth-token=${authToken}`;
	window.open(url);
}

export function createTodoFromNote(todo: TodoInfo, deepLink: string){
	const url = `things:///add?title=${todo.title}&notes=${deepLink}&when=${todo.date}`;
	window.open(url);
}
