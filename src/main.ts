import { App, Editor, MarkdownView, EditorPosition, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';

import {
	urlEncode,
	constructDeeplink
} from './url';

import {
	TodoInfo,
	createTodo,
	updateTodo,
	createTodoFromNote
} from './things3';

import {
	extractDate,
	extractTags,
	extractTarget,
	extractTitle
} from './extractor'

// import { rangeByStep, Queue } from './utils';

function getCurrentLine(editor: Editor, view: MarkdownView) {
	const lineNumber = editor.getCursor().line
	const lineText = editor.getLine(lineNumber)
	return lineText
}

interface PluginSettings {
	authToken: string,
	defaultTags: string,
	detachedMode: boolean
}

const DEFAULT_SETTINGS: PluginSettings = {
	authToken: '',
	defaultTags: '',
	detachedMode: false
}

function contructTodo(line: string, settings: PluginSettings, fileName: string){
	line = line.trim();
	const tags = extractTags(line, settings.defaultTags);
	const date = extractDate(line) || extractDate(fileName);
	line = line.replace(/#([^\s]+)/gs, '');

	const todo: TodoInfo = {
		title: extractTitle(line),
		tags: tags,
		date: date
	}

	return todo;
}

export default class Things3Plugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		// Queue for update multi liens
		// const toChange = new Queue<number>();

		// Setup Settings Tab
		await this.loadSettings();
		this.addSettingTab(new Things3SyncSettingTab(this.app, this));

		// Register Protocol Handler
		this.registerObsidianProtocolHandler("things-sync-id", async (id) => {
			if (this.settings.detachedMode) {
				return;
			}
			const todoID = id['x-things-id'];
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view == null) {
				return;
			} else {
				const editor = view.editor
				// const l = toChange.dequeue();
				// editor.setCursor(l);
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
				const vault = this.app.vault;
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} else {
					let fileName = urlEncode(fileTitle.name)
					fileName = fileName.replace(/\.md$/, '')
					const vaultName = urlEncode(vault.getName());
					const obsidianDeepLink = constructDeeplink(fileName, vaultName);
					// const obsidianDeepLink = (this.app as any).getObsidianUrl(fileTitle)
					const encodedLink = urlEncode(obsidianDeepLink);
					const line = getCurrentLine(editor, view);
					const todo = contructTodo(line, this.settings, fileName);
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

		// Toggle task status and sync to things
		this.addCommand({
			id: 'create-things-todo-from-note',
			name: 'Create Things Todo from Note',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const vault = this.app.vault;
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} else {
					let fileName = urlEncode(fileTitle.name)
					fileName = fileName.replace(/\.md$/, '')
					const vaultName = urlEncode(vault.getName());
					const obsidianDeepLink = constructDeeplink(fileName, vaultName);
					const encodedLink = urlEncode(obsidianDeepLink);
					const todo = contructTodo(fileName, this.settings, fileName);
					createTodoFromNote(todo, encodedLink)
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
			via Things3 -> Preferences -> General -> Enable things URL -> Manage.')
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
