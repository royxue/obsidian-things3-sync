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
} from './extractor';

// `commands` is an internal Obsidian API not covered by the public typings.
declare module 'obsidian' {
	interface App {
		commands: {
			executeCommandById(id: string): void;
		};
	}
}

function getCurrentLine(editor: Editor): string {
	return editor.getLine(editor.getCursor().line);
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

function constructTodo(line: string, settings: PluginSettings, fileName: string): TodoInfo {
	line = line.trim();
	const tags = extractTags(line, settings.defaultTags);
	const date = extractDate(line) || extractDate(fileName);
	line = line.replace(/#([^\s]+)/gs, '');

	return {
		title: extractTitle(line),
		tags: tags,
		date: date
	};
}

export default class Things3Plugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new Things3SyncSettingTab(this.app, this));

		// Register Protocol Handler: Things3 calls back with the new todo id so
		// we can rewrite the source line into a linked checkbox.
		this.registerObsidianProtocolHandler("things-sync-id", async (id) => {
			if (this.settings.detachedMode) {
				return;
			}
			const todoID = id['x-things-id'];
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view == null) {
				return;
			}
			const editor = view.editor;
			const currentLine = getCurrentLine(editor);
			const firstLetterIndex = currentLine.search(/[^\s#\-\[\]*]/);
			const line = currentLine.substring(firstLetterIndex, currentLine.length);
			const editorPosition = editor.getCursor();
			const lineLength = editor.getLine(editorPosition.line).length;
			const startRange: EditorPosition = {
				line: editorPosition.line,
				ch: firstLetterIndex
			};
			const endRange: EditorPosition = {
				line: editorPosition.line,
				ch: lineLength
			};

			if (firstLetterIndex > 0) {
				editor.replaceRange(`[${line}](things:///show?id=${todoID})`, startRange, endRange);
			} else {
				editor.replaceRange(`- [ ] [${line}](things:///show?id=${todoID})`, startRange, endRange);
			}
		});

		// Create a Things3 todo from the current line.
		this.addCommand({
			id: 'create-things-todo',
			name: 'Create Things Todo',
			editorCallback: (editor: Editor) => {
				const context = this.getActiveNoteContext();
				if (context == null) {
					new Notice('No active note');
					return;
				}
				const line = getCurrentLine(editor);
				const todo = constructTodo(line, this.settings, context.fileName);
				createTodo(todo, context.deepLink);
			}
		});

		// Toggle the current todo's status in both Obsidian and Things3.
		this.addCommand({
			id: 'toggle-things-todo',
			name: 'Toggle Things Todo',
			editorCallback: (editor: Editor) => {
				const line = getCurrentLine(editor);
				const target = extractTarget(line);
				if (target.todoId === '') {
					new Notice('This is not a Things3 todo');
					return;
				}
				this.app.commands.executeCommandById('editor:toggle-checklist-status');
				updateTodo(target.todoId, target.completed, this.settings.authToken);
				new Notice(`${target.todoId} set completed:${target.completed} on Things3`);
			}
		});

		// Create a Things3 todo from the whole note (title becomes the todo).
		this.addCommand({
			id: 'create-things-todo-from-note',
			name: 'Create Things Todo from Note',
			editorCallback: () => {
				const context = this.getActiveNoteContext();
				if (context == null) {
					new Notice('No active note');
					return;
				}
				const todo = constructTodo(context.fileName, this.settings, context.fileName);
				createTodoFromNote(todo, context.deepLink);
			}
		});
	}

	onunload() {
	}

	// Resolve the active note's bare name and an encoded obsidian:// deep link
	// back to it, or null when there is no active file.
	private getActiveNoteContext(): { fileName: string; deepLink: string } | null {
		const file = this.app.workspace.getActiveFile();
		if (file == null) {
			return null;
		}
		const fileName = file.name.replace(/\.md$/, '');
		const deepLink = constructDeeplink(urlEncode(fileName), urlEncode(this.app.vault.getName()));
		return { fileName, deepLink };
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
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName('Things3 Sync').setHeading();

		new Setting(containerEl)
			.setName('Auth token')
			.setDesc('Required for syncing todo status. Get it via Things3 → Settings → General → Enable Things URLs → Manage.')
			.addText(text => text
				.setPlaceholder('Enter your Things3 auth token')
				.setValue(this.plugin.settings.authToken)
				.onChange(async (value) => {
					this.plugin.settings.authToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default tags')
			.setDesc('Comma-separated tags added to every todo. Leave blank for none.')
			.addText(text => text
				.setPlaceholder('tag1,tag2')
				.setValue(this.plugin.settings.defaultTags)
				.onChange(async (value) => {
					this.plugin.settings.defaultTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Detached mode')
			.setDesc('When enabled, new todos are not linked back into the note (the source line is left unchanged).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.detachedMode)
				.onChange(async (value) => {
					this.plugin.settings.detachedMode = value;
					await this.plugin.saveSettings();
				}));
	}
}
