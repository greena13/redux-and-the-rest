export { default as serializeKey } from './utils/serializeKey';
export { setConfiguration as configure, getConfiguration } from './configuration';

export { RESOURCE, RESOURCES, COLLECTION, ITEM } from './constants/DataStructures';
export { COMPLETE, PREVIEW } from './constants/ProjectionTypes';

export { NEW, EDITING, FETCHING, CREATING, UPDATING, DESTROYING, DESTROY_ERROR, SUCCESS, PROGRESS, ERROR } from './constants/Statuses';

export { default as resources } from './resources';
