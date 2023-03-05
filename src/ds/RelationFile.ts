import { FrontMatterCache, TFile } from 'obsidian';

export interface RelationFile {
	file: TFile,
	frontmatter: FrontMatterCache,
}
