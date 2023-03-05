import { TFile } from 'obsidian';

export enum StatusBehavior {
	None = "0",
	OpenFile = "1",
	HighlightFile = "2",
}

export function statusBehaviorParse(s : string) : StatusBehavior {
	if (s == "1") return StatusBehavior.OpenFile;
	else if (s == "2") return StatusBehavior.HighlightFile;
	else return StatusBehavior.None;
}

export function statusBehaviorOpenFile(file: TFile) {
	window.open(`obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURI(file.path)}`);
}

export function statusBehaviorHighlightFile(file: TFile) {

			// hacky way to open the tree and highlight the current file.
			this.app.workspace.leftSplit.expand();
			const files = this.app.workspace.leftSplit.children[0].children[0];
			files.tabHeaderEl.click();
			while (!files.view.isAllCollapsed) files.view.collapseOrExpandAllEl.click();
			// toggle all the others
			const pathParts = file.parent.path.split("/");
			while(pathParts.length > 0) {
				const working = pathParts.join("/");
				while(files.view.fileItems[working].collapsed) files.view.fileItems[working].toggleCollapsed();
				pathParts.pop();
			}
			const ypos = files.view.fileItems[file.parent.path].el.getBoundingClientRect().y;
			files.view.containerEl.children[1].scrollTo(0,ypos);


}
