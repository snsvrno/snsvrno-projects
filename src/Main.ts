import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface SnsvrnoProjectsSettings {
	frontmatterKey: string;
	frontmatterValue: string;
	statusBarFormat: string;
	statusBarBehavior: string;
}

const DEFAULT_SETTINGS: SnsvrnoProjectsSettings = {
	frontmatterValue: 'value',
	frontmatterKey: 'key',
	statusBarFormat: '',
	statusBarBehavior: 'None',
}

export default class SnsvrnoProjects extends Plugin {
	settings: SnsvrnoProjectsSettings;
	statusBarElement: HTMLElement;

	async onload() {
		await this.loadSettings();

		this.statusBarElement = this.addStatusBarItem();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SnsvrnoProjectsSettingTab(this.app, this));

		this.registerEvent(app.workspace.on('file-open', (file) => {
			if (!file) return;

			var frontMatter = this.getProjectFrontMatter(file.parent.path);
			if (frontMatter != null) {
				this.buildStatusBarText(frontMatter);
			}
		}));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	/**
	 * gets the front matter for the project, if one is found
	 * otherwise returns null
	 */
	getProjectFrontMatter(path : string) {
		// filters down the files to only those that share paths.
		var files = app.vault.getFiles().filter((f) => {
			return f.parent.path == path.substring(0,f.parent.path.length);
		});

		// now we work up the path tree
		var parts = path.split("/");
		while (parts.length > 0) {
			var subPath = parts.join("/");
			for (let i = 0; i < files.length; i++) {
				// checks if we are in the same folder
				if (files[i].parent.path == subPath) {
					var metadata = app.metadataCache.getFileCache(files[i]);
					if (metadata?.frontmatter && metadata.frontmatter[this.settings.frontmatterKey] == this.settings.frontmatterValue) {
						return { frontmatter: metadata.frontmatter, file: files[i] };
					}
				}
			}
			parts.pop();
		}

	}

	/**
	 * creates the statusbar text
	 */
	buildStatusBarText(data) {

		var statusText = this.settings.statusBarFormat;
		var regex = /(\$\{?([A-Za-z\-0-9]+)\}?)/;
		var r = regex.exec(statusText);
		while(r != null) {
			statusText = statusText.replace(r[0], data.frontmatter[r[2]]);
			r = regex.exec(statusText);
		}

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarElement.setText(statusText);
		// sets the click to open the file is that is what is desired
		if (this.settings.statusBarBehavior == "OpenFile") this.statusBarElement.onclick = (_) => {
			window.open(`obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURI(data.file.path)}`);
		}
		// highlights and uncollapses the item in the tree
		if (this.settings.statusBarBehavior == "HighlightFile") this.statusBarElement.onclick = (_) => {

			// hacky way to open the tree and highlight the current file.
			this.app.workspace.leftSplit.expand();
			const files = this.app.workspace.leftSplit.children[0].children[0];
			files.tabHeaderEl.click();
			while (!files.view.isAllCollapsed) files.view.collapseOrExpandAllEl.click();
			// toggle all the others
			const pathParts = data.file.parent.path.split("/");
			while(pathParts.length > 0) {
				const working = pathParts.join("/");
				while(files.view.fileItems[working].collapsed) files.view.fileItems[working].toggleCollapsed();
				pathParts.pop();
			}
			const ypos = files.view.fileItems[data.file.parent.path].el.getBoundingClientRect().y;
			files.view.containerEl.children[1].scrollTo(0,ypos);

		}
		// adds the clickable CSS sa it looks right
		if (this.settings.statusBarBehavior != "None") this.statusBarElement.addClass('mod-clickable');

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

class SnsvrnoProjectsSettingTab extends PluginSettingTab {
	plugin: SnsvrnoProjects;

	constructor(app: App, plugin: SnsvrnoProjects) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'General Settings'});

		new Setting(containerEl)
			.setName('Front Matter Matching')
			.setDesc('What front matter value could be a project, and what would its value be.')
			.addText(text => text.setPlaceholder('Front Matter')
				.setValue(this.plugin.settings.frontmatterKey)
				.onChange(async (value) => {
					this.plugin.settings.frontmatterKey = value;
					await this.plugin.saveSettings();
				}))
			.addText(text => text.setPlaceholder('Front Matter')
				.setValue(this.plugin.settings.frontmatterValue)
				.onChange(async (value) => {
					this.plugin.settings.frontmatterValue = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h2', {text: 'Status Bar Settings'});

		new Setting(containerEl)
			.setName('Format')
			.setDesc('Format for the status bar text.')
			.addText(text => text.setPlaceholder('')
				.setValue(this.plugin.settings.statusBarFormat)
				.onChange(async (value) => {
					this.plugin.settings.statusBarFormat = value;
					await this.plugin.saveSettings();
				})
			);
	
		new Setting(containerEl)
			.setName('Click Behavior')
			.setDesc('What happens when you click the project name.')
			.addDropdown(drop => drop
				.addOption("None", "None")
				.addOption("OpenFile", "Open Project File")
				.addOption("HighlightFile", "Highlight Current File in Tree")
				.setValue(this.plugin.settings.statusBarBehavior)
				.onChange(async (value) => {
					this.plugin.settings.statusBarBehavior = value;
					await this.plugin.saveSettings();
				}));

	}
}
