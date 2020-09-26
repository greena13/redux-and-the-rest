import { CREATING, DESTROYING, FETCHING, PROGRESS, UPDATING } from '../constants/Statuses';
import isStatus from './isStatus';
import isFinished from './isFinished';
import isNew from './isNew';

export { default as serializeKey } from './serializeKey';
export { setConfiguration as configure, getConfiguration } from '../configuration';

export { default as canFallbackToOldValues } from './canFallbackToOldValues';

export { default as getTimeSinceFetchStarted } from './getTimeSinceFetchStarted';
export { default as getTimeSinceLastSync } from './getTimeSinceLastSync';
export { default as getValuesBeforeEditing } from './getValuesBeforeEditing';
export { default as getHttpStatusCode } from './getHttpStatusCode';

export { default as isNewItemKey } from './isNewItemKey';

export { default as isNew } from './isNew';
export { default as isEdited } from './isEdited';
export const isCreated = ((item) => !isNew(item));
export const isFetched = ((item) => !isNew(item));

export const isFetching = ((itemOrList) => isStatus(itemOrList, FETCHING));
export const isCreating = ((itemOrList) => isStatus(itemOrList, CREATING));
export const isUpdating = ((itemOrList) => isStatus(itemOrList, UPDATING));
export const isDestroying = ((itemOrList) => isStatus(itemOrList, DESTROYING));
export const isSaving = ((itemOrList) => isStatus(itemOrList, [CREATING, UPDATING]));
export const isSyncing = ((itemOrList) => isStatus(itemOrList, [FETCHING, CREATING, UPDATING, DESTROYING, PROGRESS]));

export const isFinishedFetching = ((itemOrList) => isFinished(itemOrList, FETCHING));
export const isFinishedCreating = ((itemOrList) => isFinished(itemOrList, CREATING));
export const isFinishedUpdating = ((itemOrList) => isFinished(itemOrList, UPDATING));
export const isFinishedDestroying = ((itemOrList) => isFinished(itemOrList, DESTROYING));
export const isFinishedSaving = ((itemOrList) => isFinished(itemOrList, [CREATING, UPDATING]));
export const isFinishedSyncing = ((itemOrList) => isFinished(itemOrList, [FETCHING, CREATING, UPDATING, DESTROYING, PROGRESS]));

export { default as isSuccess } from './isSuccess';
export { default as isError } from './isError';
