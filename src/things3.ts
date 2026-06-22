export interface TodoInfo {
	title: string,
	tags: string,
	date: string
}

// Build a things:/// URL, percent-encoding every parameter value and
// dropping empty ones so special characters never break the link.
function buildThingsUrl(action: string, params: Record<string, string>): string {
	const query = Object.entries(params)
		.filter(([, value]) => value != null && value !== '')
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join('&');
	return `things:///${action}?${query}`;
}

export function createTodo(todo: TodoInfo, deepLink: string){
	const url = buildThingsUrl('add', {
		title: todo.title,
		notes: deepLink,
		when: todo.date,
		tags: todo.tags,
		'x-success': 'obsidian://things-sync-id',
	});
	window.open(url);
}

export function updateTodo(todoId: string, completed: boolean, authToken: string){
	const url = buildThingsUrl('update', {
		id: todoId,
		completed: String(completed),
		'auth-token': authToken,
	});
	window.open(url);
}

export function createTodoFromNote(todo: TodoInfo, deepLink: string){
	const url = buildThingsUrl('add', {
		title: todo.title,
		notes: deepLink,
		when: todo.date,
	});
	window.open(url);
}
