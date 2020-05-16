export { default as serializeKey } from './public-helpers/serializeKey';
export { setConfiguration as configure, getConfiguration } from './configuration';

export { default as canFallbackToOldValues } from './public-helpers/canFallbackToOldValues';

export { default as getTimeSinceFetchStarted } from './public-helpers/getTimeSinceFetchStarted';
export { default as getTimeSinceLastSync } from './public-helpers/getTimeSinceLastSync';
export { default as getValuesBeforeEditing } from './public-helpers/getValuesBeforeEditing';

export { default as isEdited } from './public-helpers/isEdited';
export { default as isFinishedFetching } from './public-helpers/isFinishedFetching';
export { default as isSuccessfullyFetched } from './public-helpers/isSuccessfullyFetched';
export { default as isInAnErrorState } from './public-helpers/isInAnErrorState';

export { RESOURCE, RESOURCES, COLLECTION, ITEM } from './constants/DataStructures';
export { COMPLETE, PREVIEW } from './constants/ProjectionTypes';

export { NEW, EDITING, FETCHING, CREATING, UPDATING, DESTROYING, DESTROY_ERROR, SUCCESS, PROGRESS, ERROR } from './constants/Statuses';

export { CLIENT_ERROR } from './constants/NetworkStatuses';

export { default as resources } from './resources';
export { default as resource } from './resource';

