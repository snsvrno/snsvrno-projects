import { App, PluginSettingTab, Setting } from 'obsidian';

import SnsvrnoRelations from './Main';
import { RelationSettings } from './ds/Relation';
import { StatusBehavior, statusBehaviorParse } from './ds/StatusBehavior';
import { StatusIcon } from './ds/StatusIcon';

export class SnsvrnoRelationsSettingTab extends PluginSettingTab {
	plugin: SnsvrnoRelations;

	constructor(app: App, plugin: SnsvrnoRelations) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		this.containerEl.empty();

		this.containerEl.createEl('h2', {text: 'General Settings'});

		this.containerEl.createEl('h2', {text: 'Relations Settings'});
		new Setting(this.containerEl);
		new Setting(this.containerEl.createDiv()).setName("Relations").setDesc("Set the file relation definitions. Define the front matter metadata that will be used and how it will be desplayed in the status bar.");
		this.displayRelationHeader();
		this.plugin.settings.relations.forEach((r) => this.displayRelation(r));
		new Setting(this.containerEl).addExtraButton(b => b.setIcon("plus").onClick(() => {
			var newRelation : RelationSettings = {
				frontmatterKey: "",
				frontmatterValue: "",
				statusFormat: "",
				statusBehavior: StatusBehavior.None,
				statusIcon: StatusIcon.None,
			};

			this.plugin.settings.relations.push(newRelation);
			this.display();
		}));
	}

	displayRelationHeader() : void {
		var el = this.containerEl.createDiv();
		new Setting(el).setClass("header")
			.addText(text => text.setValue("front matter key").setDisabled(true))
			.addText(text => text.setValue("front matter value").setDisabled(true))
			.addText(text => text.setValue("display").setDisabled(true))
			.addText(text => text.setValue("click action").setDisabled(true))
			.addText(text => text.setValue("").setDisabled(true))

		;
	}

	displayRelation(relation : RelationSettings) : void {
		var el = this.containerEl.createDiv();
		new Setting(el)
			.addText(text => text.setPlaceholder("key").setValue(relation.frontmatterKey)
				.onChange(async (v) => {
					relation.frontmatterKey = v;
					await this.plugin.saveSettings();
				})).setClass("r-setting")
			.addText(text => text.setPlaceholder("value").setValue(relation.frontmatterValue)
				.onChange(async (v) => {
					relation.frontmatterValue = v;
					await this.plugin.saveSettings();
				}))
			.addText(text => text.setPlaceholder("display fromat").setValue(relation.statusFormat)
				.onChange(async (v) => {
					relation.statusFormat = v;
					await this.plugin.saveSettings();
				}))
			.addDropdown(dd => dd
				.addOption("0","None")
				.addOption("1","Open File")
				.setValue(relation.statusBehavior)
				.onChange(async (v) => {
					relation.statusBehavior = statusBehaviorParse(v);
					await this.plugin.saveSettings();
				}))
			.addExtraButton(b => b.setIcon("cross").onClick(async () => {
				// deletes the relation and saves the settings
				this.plugin.settings.relations.remove(relation);
				await this.plugin.saveSettings();
				this.display();
			}))
			.addExtraButton(b => b.setIcon("arrow-up").onClick(async () => {
				var index = this.plugin.settings.relations.indexOf(relation);
				if (index != 0) {
					var other = this.plugin.settings.relations[index-1];
					this.plugin.settings.relations[index-1] = relation;
					this.plugin.settings.relations[index] = other;
				}
				await this.plugin.saveSettings();
				this.display();
			}))
			.addExtraButton(b => b.setIcon("arrow-down").onClick(async () => {
				var index = this.plugin.settings.relations.indexOf(relation);
				if (index != this.plugin.settings.relations.length - 1) {
					var other = this.plugin.settings.relations[index+1];
					this.plugin.settings.relations[index+1] = relation;
					this.plugin.settings.relations[index] = other;
				}
				await this.plugin.saveSettings();
				this.display();

			}))
		;
	}
	
}
