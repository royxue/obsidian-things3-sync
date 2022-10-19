import { App, Editor, MarkdownView, EditorPosition, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';

function getCurrentLine(editor: Editor, view: MarkdownView) {
	const lineNumber = editor.getCursor().line
	const lineText = editor.getLine(lineNumber)
	return lineText
}

interface TodoInfo {
	title: string,
	tags: string
}

interface PluginSettings {
	authToken: string,
	obsidianTags: string
}

const DEFAULT_SETTINGS: PluginSettings = {
	authToken: '',
	obsidianTags: 'Obsidian'
}

function urlEncode(line: string) {
	line = encodeURIComponent(line)
	return line
}

function contructTodo(line: string, settings: PluginSettings){
	line = line.trim();

	const todo: TodoInfo = {
		title: extractTitle(line),
		tags: extractTags(line, settings.obsidianTags),
	}

	return todo;
}

function extractTitle(line: string) {
	const regex = /#([^\s]+)/g
	const title = line.replace(regex, '').trim();
	
	return title;
}

function extractTags(line: string, setting_tags: string){
	const regex = /#([^\s]+)/g
	const array = [...line.matchAll(regex)]
	var tag_array = array.map(x => x[1])
	tag_array.push(setting_tags);
	const tags = tag_array.join(',')
	
	return tags
}

function extractTarget(line: string) {
	const regexId = /id=(\w+)/
	const id = line.match(regexId);
	var todoId: string;
	if (id != null) {
		todoId = id[1];	
	} else {
		todoId = ''
	}

	const regexStatus = /\[(.)\]/
	const status = line.match(regexStatus)
	var afterStatus: string;
	if (status && status[1] == ' ') {
		afterStatus = 'true'
	} else {
		afterStatus = 'false'
	}

	return  {todoId, afterStatus}
}

function createTodo(todo: TodoInfo, deepLink: string){
	const url = `things:///add?title=${todo.title}&notes=${deepLink}&tags=${todo.tags}&x-success=obsidian://todo-id`
	window.open(url);
}

function updateTodo(todoId: string, completed: string, authToken: string){
	const url = `things:///update?id=${todoId}&completed=${completed}&auth-token=${authToken}`
	window.open(url);
}



export default class Things3Plugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		
		// Setup Settings Tab
		await this.loadSettings();
		this.addSettingTab(new Things3SyncSettingTab(this.app, this));


		// Register Protocol Handler
		this.registerObsidianProtocolHandler("todo-id", async (id) => {
			const todoID = id['x-things-id'];
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view == null) {
				return;
			} else {
				const editor = view.editor
				const currentLine = getCurrentLine(editor, view)
				const firstLetterIndex = currentLine.search(/[^\s#-\[\]\*]/);
				const line = currentLine.substring(firstLetterIndex, currentLine.length)
				let editorPosition = view.editor.getCursor()
				const lineLength = view.editor.getLine(editorPosition.line).length
				let startRange: EditorPosition = {
					line: editorPosition.line,
					ch: firstLetterIndex
				}
				let endRange: EditorPosition = {
					line: editorPosition.line,
					ch: lineLength
				}
				view.editor.replaceRange(`- [ ] [${line}](things:///show?id=${todoID})`, startRange, endRange);
			}
		});
	
		// Create TODO Command
		this.addCommand({
			id: 'create-things-todo',
			name: 'Create Things Todo',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} else {
					let fileName = urlEncode(fileTitle.name)
					fileName = fileName.replace(/\.md$/, '')
					const obsidianDeepLink = (this.app as any).getObsidianUrl(fileTitle)
					const encodedLink = urlEncode(obsidianDeepLink)
					const line = getCurrentLine(editor, view)
					const todo = contructTodo(line, this.settings)
					createTodo(todo, encodedLink)
				}
			}
		});
		
		// Toggle task status and sync to things
		this.addCommand({
			id: 'toggle-things-todo',
			name: 'Toggle Things Todo',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} else {
					const line = getCurrentLine(editor, view)
					const target = extractTarget(line)
					if (target.todoId == '') {
						new Notice(`This is not a things3 todo`);
					} else {
						view.app.commands.executeCommandById("editor:toggle-checklist-status")
						updateTodo(target.todoId, target.afterStatus, this.settings.authToken)
						new Notice(`${target.todoId} set completed:${target.afterStatus} on things3`);
					}
					
				}
			}
		});
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class Things3SyncSettingTab extends PluginSettingTab {
	plugin: Things3Plugin;;

	constructor(app: App, plugin: Things3Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for obsidian x thing3 plugin.'});

		new Setting(containerEl)
			.setName('Auth Token')
			.setDesc('Require Things3 Auth Token for upadte TODO status \n Get Auth Token \
			from things/Preferece/General/Enable things URL/Manage.')
			.addText(text => text
				.setPlaceholder('Enter your auth Token')
				.setValue(this.plugin.settings.authToken)
				.onChange(async (value) => {
					// console.log('Secret: ' + value);
					this.plugin.settings.authToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Obsidian Tag')
			.setDesc('The tags to mark obsidian TODO;\n Multiple tags using comma \
			to separate tags;\n Leave this to blank will not add default tags')
			.addText(text => text
				.setPlaceholder('Enter your Tags')
				.setValue(this.plugin.settings.obsidianTags)
				.onChange(async (value) => {
					// console.log('Secret: ' + value);
					this.plugin.settings.obsidianTags = value;
					await this.plugin.saveSettings();
				}));
	}
}
