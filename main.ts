import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

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
	obsidianTag: string
}

const DEFAULT_SETTINGS: PluginSettings = {
	authToken: '',
	obsidianTag: 'Obsidian'
}

function urlEncode(line: string) {
	line = encodeURIComponent(line)
	return line
}

function contructTodo(line: string){
	line = line.trim();

	const todo: TodoInfo = {
		title: extractTitle(line),
		tags: extractTags(line),
	}

	return todo;
}

function extractTitle(line: string) {
	const regex = /#([^\s]+)/g
	const title = line.replace(regex, '').trim();
	
	return title;
}

function extractTags(line: string){
	const regex = /#([^\s]+)/
	const array = [...line.matchAll(regex)]
	const tag_array = array.map(x => x[1])
	const tags = tag_array.join(',')
	
	return tags
}

function createTodo(todo: TodoInfo, deepLink: string){
	const task = `things:///add?title=${todo.title}&notes=${deepLink}&tags=${todo.tags}&x-success=obsidian://todo-id`
	window.open(task);
}

function updateTodo(task_id: string, completed: string){
	const task = `things:///update?id=${task_id}&completed=${completed}&authToken=${this.settings.authToken}`
	window.open(task);
}



export default class Things3Plugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new Things3SyncSettingTab(this.app, this));

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
	
		
		this.addCommand({
			id: 'create-things-task',
			name: 'Create Things Task',
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
					const todo = contructTodo(line)
					createTodo(todo, encodedLink)
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
			.setDesc('Require Things3 Auth Token for upadte TODO status')
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
			.setDesc('A Tag to mark TODOs from Obsidian')
			.addText(text => text
				.setPlaceholder('Enter your Tag')
				.setValue(this.plugin.settings.obsidianTag)
				.onChange(async (value) => {
					// console.log('Secret: ' + value);
					this.plugin.settings.obsidianTag = value;
					await this.plugin.saveSettings();
				}));
	}
}
