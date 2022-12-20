import { App, Editor, MarkdownView, EditorPosition, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';

function getCurrentLine(editor: Editor, view: MarkdownView) {
	const lineNumber = editor.getCursor().line
	const lineText = editor.getLine(lineNumber)
	return lineText
}

interface TodoInfo {
	title: string,
	tags: string,
	date: string
}

interface PluginSettings {
	authToken: string,
	defaultTags: string
}

const DEFAULT_SETTINGS: PluginSettings = {
	authToken: '',
	defaultTags: ''
}

function urlEncode(line: string) {
	line = encodeURIComponent(line)
	return line
}

function contructTodo(line: string, settings: PluginSettings, fileName: string){
	line = line.trim();
	const tags = extractTags(line, settings.defaultTags);

	line = line.replace(/#([^\s]+)/gs, '');

	const todo: TodoInfo = {
		title: extractTitle(line),
		tags: tags,
		date: extractDate(fileName)
	}

	return todo;
}

function extractDate(line:string) {
	const regex = /^(19|20)\d\d([- /.])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])/
	let date = '';
	const res = line.match(regex);
	if (res) {
    date = res[0];
  }
	return date;
}

function extractTitle(line: string) {
	const regex = /[^#\s\-\[\]*](.*)/gs
	const content = line.match(regex);
	let title = '';
	if (content != null) {
		title = content[0]
	}
	
	return title;
}

function extractTags(line: string, setting_tags: string){
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

function extractTarget(line: string) {
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

function createTodo(todo: TodoInfo, deepLink: string){
	const url = `things:///add?title=${todo.title}&notes=${deepLink}&when=${todo.date}&x-success=obsidian://things-sync-id&tags=${todo.tags}`;
	window.open(url);
}

function updateTodo(todoId: string, completed: string, authToken: string){
	const url = `things:///update?id=${todoId}&completed=${completed}&auth-token=${authToken}`;
	window.open(url);
}

export default class Things3Plugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		
		// Setup Settings Tab
		await this.loadSettings();
		this.addSettingTab(new Things3SyncSettingTab(this.app, this));

		// Register Protocol Handler
		this.registerObsidianProtocolHandler("things-sync-id", async (id) => {
			const todoID = id['x-things-id'];
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view == null) {
				return;
			} else {
				const editor = view.editor
				const currentLine = getCurrentLine(editor, view)
				const firstLetterIndex = currentLine.search(/[^\s#\-\[\]*]/);
				const line = currentLine.substring(firstLetterIndex, currentLine.length)
				const editorPosition = view.editor.getCursor()
				const lineLength = view.editor.getLine(editorPosition.line).length
				const startRange: EditorPosition = {
					line: editorPosition.line,
					ch: firstLetterIndex
				}
				const endRange: EditorPosition = {
					line: editorPosition.line,
					ch: lineLength
				}

				if (firstLetterIndex > 0) {
					view.editor.replaceRange(`[${line}](things:///show?id=${todoID})`, startRange, endRange);
				} else {
					view.editor.replaceRange(`- [ ] [${line}](things:///show?id=${todoID})`, startRange, endRange);
				}
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
					const todo = contructTodo(line, this.settings, fileName)
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
	plugin: Things3Plugin;

	constructor(app: App, plugin: Things3Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for Obsidian Things3 Sync.'});

		new Setting(containerEl)
			.setName('Auth Token')
			.setDesc('Require Things3 Auth Token for syncing Todo status; Get Auth Token\
			via Things3 -> Preferece -> General -> Enable things URL -> Manage.')
			.addText(text => text
				.setPlaceholder('Leave Things3 Auth Token here')
				.setValue(this.plugin.settings.authToken)
				.onChange(async (value) => {
					this.plugin.settings.authToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default Tags')
			.setDesc('The default tags for Obsidian Todo; Using comma(,) \
			to separate multiple tags; Leave this in blank for no default tags')
			.addText(text => text
				.setPlaceholder('Leave your tags here')
				.setValue(this.plugin.settings.defaultTags)
				.onChange(async (value) => {
					this.plugin.settings.defaultTags = value;
					await this.plugin.saveSettings();
				}));
	}
}
