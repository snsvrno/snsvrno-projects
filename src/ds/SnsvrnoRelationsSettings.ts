import { RelationSettings} from './Relation';

export interface SnsvrnoRelationsSettings {
	relations: Array<RelationSettings>;
}

export const DEFAULT_SETTINGS: SnsvrnoRelationsSettings = {
	relations: [ ],
}


