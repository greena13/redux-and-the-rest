export { default as serializeKey } from './public-helpers/serializeKey';
export { setConfiguration as configure, getConfiguration } from './configuration';

export { RESOURCE, RESOURCES, COLLECTION, ITEM } from './constants/DataStructures';
export { COMPLETE, PREVIEW } from './constants/ProjectionTypes';

export { NEW, EDITING, FETCHING, CREATING, UPDATING, DESTROYING, DESTROY_ERROR, SUCCESS, PROGRESS, ERROR } from './constants/Statuses';

export { CLIENT_ERROR } from './constants/NetworkStatuses';

export { default as resources } from './resources';
