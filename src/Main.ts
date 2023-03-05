import { App, Editor, setIcon, Plugin, TFile } from 'obsidian';

// import { RelationSettings} from './ds/Relation';
import { SnsvrnoRelationsSettings, DEFAULT_SETTINGS } from './ds/SnsvrnoRelationsSettings';
import { SnsvrnoRelationsSettingTab } from './Settings';
import { RelationSettings } from './ds/Relation';
import { RelationFile } from './ds/RelationFile';
import { StatusBehavior, statusBehaviorOpenFile, statusBehaviorHighlightFile } from './ds/StatusBehavior';

export default class SnsvrnoRelations extends Plugin {
	settings: SnsvrnoRelationsSettings;
	statusBarElement: HTMLElement;
	statusBarElements: Map<RelationSettings,HTMLElement>;
	// files that share the same path, so we don't have
	// to search again for ever relation.
	fileOfInterest: Array<TFile>;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SnsvrnoRelationsSettingTab(this.app, this));

		this.fileOfInterest = [ ];
		this.statusBarElement = this.addStatusBarItem();
		this.statusBarElement.removeClass("status-bar-item");
		this.statusBarElements = new Map();
		this.registerEvent(app.workspace.on('file-open', (file) => {
			// we start off by hiding the element
			this.statusBarElements.forEach((el,_relation,_map) => el.hide());
			//this.statusBarElement.hide();

			if (!file || this.settings.relations.length == 0) return;

			this.sortStatusBar();

			// gets the files of interest
			// filters down the files to only those that share paths.
			while (this.fileOfInterest.length > 0) this.fileOfInterest.pop(); // drains it
			app.vault.getFiles().forEach((f) => { if(f.parent.path == file.parent.path.substring(0,f.parent.path.length)) this.fileOfInterest.push(f); });


			this.settings.relations.forEach((relation) => {
				var data = this.getMatchingFrontmatter(relation, file.parent.path);
				if (data != null) {
					var el = this.statusBarElements.get(relation);
					if (el == null) {
						el = createEl("div");
						el.addClass("status-bar-item");
						this.statusBarElement.appendChild(el);
						this.statusBarElements.set(relation, el);
					}
					this.buildStatusBarText(el, data, relation);
				}
			});

		}));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	sortStatusBar() {
		if (this.statusBarElement.children.length == 1) return;

		this.statusBarElements.forEach((v,_rel,_m) => this.statusBarElement.removeChild(v));
		this.statusBarElements.forEach((v,_rel,_m) => this.statusBarElement.appendChild(v));
	}

	getMatchingFrontmatter(relation : RelationSettings, path : string) : RelationFile | null {

		var parts = path.split("/");
		while (parts.length > 0) {
			var subPath = parts.join("/");
			for (let i = 0; i < this.fileOfInterest.length; i++) {
				// checks if we are in the same folder
				if (this.fileOfInterest[i].parent.path == subPath) {
					var metadata = app.metadataCache.getFileCache(this.fileOfInterest[i]);
					if (metadata?.frontmatter && metadata.frontmatter[relation.frontmatterKey] == relation.frontmatterValue) {
						return { frontmatter: metadata.frontmatter, file: this.fileOfInterest[i] };
					}
				}
			}
			parts.pop();
		}

		return null;
	}

	buildStatusBarText(el : HTMLElement, data : RelationFile, relation : RelationSettings) {
		el.show();

		var statusText = relation.statusFormat;
		var regex = /(\$\{?([A-Za-z\-0-9]+)\}?)/;
		var r = regex.exec(statusText);
		while(r != null) {
			statusText = statusText.replace(r[0], data.frontmatter[r[2]]);
			r = regex.exec(statusText);
		}

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		el.setText(statusText);
		if (relation.statusBehavior == StatusBehavior.OpenFile) el.onclick = () => statusBehaviorOpenFile(data.file);
		if (relation.statusBehavior == StatusBehavior.HighlightFile) el.onclick = (_) => statusBehaviorHighlightFile(data.file)
		if (relation.statusBehavior != StatusBehavior.None) el.addClass('mod-clickable');
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


