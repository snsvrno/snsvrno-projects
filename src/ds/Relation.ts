import { StatusBehavior } from './StatusBehavior';
import { StatusIcon } from './StatusIcon';

export interface RelationSettings {
	frontmatterKey: string;
	frontmatterValue: string;
	statusFormat: string;
	statusBehavior: StatusBehavior;
	statusIcon: StatusIcon;
}

