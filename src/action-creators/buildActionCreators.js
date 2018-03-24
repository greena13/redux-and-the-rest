import serializeKey from '../utils/serializeKey';

import makeRequest from './helpers/makeRequest';

import warn from '../utils/dev/warn';
import isObject from '../utils/object/isObject';
import receiveCollection from './index/receiveCollection';
import handleCollectionError from './index/handleCollectionError';
import requestCollection from './index/requestCollection';
import requestResource from './show/requestResource';
import receiveResource from './show/receiveResource';
import handleResourceError from './show/handleResourceError';
import submitCreateResource from './create/submitCreateResource';
import receiveCreatedResource from './create/receiveCreatedResource';
import handleCreateResourceFailure from './create/handleCreateResourceError';
import submitUpdateResource from './update/submitUpdateResource';
import receiveUpdatedResource from './update/receiveUpdatedResource';
import handleUpdateResourceError from './update/handleUpdateResourceError';
import deleteResourceUpdate from './destroy/deleteResourceUpdate';
import removeResource from './destroy/removeResource';
import handleDestroyResourceError from './destroy/handleDestroyResourceError';
import camelCase from '../utils/string/camelCase';
import wrapInObject from '../utils/object/wrapInObject';
import resolveOptions from './helpers/resolveOptions';
import { EDITING, NEW } from '../constants/Statuses';
import { ITEM } from '../constants/DataStructures';
import resourceTypeTransform from './helpers/transforms/resourceTypeTransform';
import applyTransforms from '../reducers/helpers/applyTransforms';
import without from '../utils/collection/without';
import arrayFrom from '../utils/array/arrayFrom';
import generateUrl from './helpers/generateUrl';

function fetchCollection(options, params, ssrOptions = { }) {
  const {
    action, resourceType, url: urlTemplate, name, keyBy, urlOnlyParams, progress
  } = options;

  const keyParams = without(params, urlOnlyParams);

  const key = serializeKey(keyParams);
  const url = generateUrl({ url: urlTemplate, name }, wrapInObject(params, 'id'));

  return (dispatch) => {

    dispatch(requestCollection({ action, resourceType }, key));

    return makeRequest({
      ...options,
      keyBy,

      url, key,
      dispatch,
      credentials: true,
      onSuccess: receiveCollection,
      onError: handleCollectionError,
      progress
    }, ssrOptions);
  };
}

function fetchResource(options, params, ssrOptions = { }) {
  const {
    action, transforms, url: urlTemplate, name, resourceType, urlOnlyParams, progress
  } = options;

  const keyParams = without(params, urlOnlyParams);

  const key = serializeKey(keyParams);
  const url = generateUrl({ url: urlTemplate, name }, wrapInObject(params, 'id'));

  return (dispatch) => {
    dispatch(requestResource({ action, resourceType, transforms }, key));

    return makeRequest({
      ...options,
      url, key,
      dispatch,
      credentials: true,
      onSuccess: receiveResource,
      onError: handleResourceError,
      progress
    }, ssrOptions);
  };
}

function selectResource({ action, urlOnlyParams }, params, context = true) {
  const keyParams = without(params, urlOnlyParams);

  const key = serializeKey(keyParams);

  return {
    type: action, key, context
  };
}

function selectAnotherResource({ action, urlOnlyParams }, params, context = true) {

  const keyParams = without(params, urlOnlyParams);
  const key = serializeKey(keyParams);

  return {
    type: action, key, context
  };
}

function deselectResource({ action, urlOnlyParams }, params) {
  const keyParams = without(params, urlOnlyParams);
  const key = serializeKey(keyParams);

  return {
    type: action,
    key
  };
}

function clearSelectedCollection({ action }) {
  return { type: action };
}

function newResource(options, params, values = {}, collectionKeys = []) {
  const { action, transforms, urlOnlyParams } = options;

  const keyParams = without(params, urlOnlyParams);
  const temporaryKey = serializeKey(keyParams);

  return {
    type: action,
    status: NEW,
    temporaryKey,
    collectionKeys: arrayFrom(collectionKeys).map((id) => serializeKey(id)),
    item: applyTransforms(transforms, options, {
      ...ITEM,
      values,
      status: { type: NEW },
    }),
  };
}

function clearNewResource({ action, resourceType }) {
  return { type: action, resourceType };
}

function editResource(options, params, values) {
  const { action, transforms, urlOnlyParams } = options;

  const keyParams = without(params, urlOnlyParams);

  return {
    type: action,
    status: EDITING,
    key: serializeKey(keyParams),
    item: applyTransforms(transforms, options, {
      ...ITEM,
      values,
      status: { type: EDITING }
    })
  };
}

function createResource(options, params, values, collectionKeys = []) {
  const {
    action,
    resourceType,
    transforms,
    url: urlTemplate,
    name,
    keyBy,
    urlOnlyParams,
    progress
  } = options;

  const keyParams = without(params, urlOnlyParams);
  const key = serializeKey(keyParams);

  const _collectionKeys = arrayFrom(collectionKeys).map((id)=> serializeKey(id));

  const url = generateUrl({ url: urlTemplate, name }, without(wrapInObject(params, 'id'), 'id'));

  return (dispatch) => {
    dispatch(
      submitCreateResource({ action, resourceType, transforms }, key, values, _collectionKeys)
    );

    return makeRequest({
      ...options,
      collectionKeys: _collectionKeys,
      keyBy,

      url, key,
      dispatch,
      credentials: true,
      request: {
        method: 'POST',
        body: JSON.stringify(values),
      },
      onSuccess: receiveCreatedResource,
      onError: handleCreateResourceFailure,
      progress
    });
  };
}

function updateResource(options, params, values, previousValues) {
  const {
    action, resourceType, transforms, url: urlTemplate, name, urlOnlyParams, progress
  } = options;

  const keyParams = without(params, urlOnlyParams);
  const key = serializeKey(keyParams);

  const url = generateUrl({ url: urlTemplate, name }, wrapInObject(params, 'id'));

  return (dispatch) => {
    dispatch(submitUpdateResource({ transforms, action, resourceType }, key, values, previousValues));

    return makeRequest({
      ...options,

      previousValues,
      url, key,
      dispatch,
      credentials: true,
      request: {
        method: 'PUT',
        body: JSON.stringify(values),
      },
      onSuccess: receiveUpdatedResource,
      onError: handleUpdateResourceError,
      progress
    });
  };
}

function destroyResource(options, params, previousValues) {
  const {
    action,
    resourceType,
    name,
    urlOnlyParams,
    url: urlTemplate,
    progress
  } = options;

  const keyParams = without(params, urlOnlyParams);
  const key = serializeKey(keyParams);
  const url = generateUrl({ url: urlTemplate, name }, wrapInObject(params, 'id'));

  return (dispatch) => {

    dispatch(deleteResourceUpdate({ action, resourceType }, key, previousValues));

    return makeRequest({
      ...options,

      url, key, previousValues,
      dispatch,
      credentials: true,
      request: {
        method: 'delete',
      },
      onSuccess: removeResource,
      onError: handleDestroyResourceError,
      progress
    });
  };
}


const STANDARD_ACTION_CREATORS = {
  index: fetchCollection,
  show: fetchResource,
  new: newResource,
  clearNew: clearNewResource,
  create: createResource,
  edit: editResource,
  update: updateResource,
  destroy: destroyResource,
  select: selectResource,
  selectAnother: selectAnotherResource,
  deselect: deselectResource,
  clearSelected: clearSelectedCollection
};

function buildActionCreators(resourceOptions, actions, actionsOptions) {
  const { name } = resourceOptions;

  return Object.keys(actionsOptions).reduce((memo, key) => {
    const actionName = actions.get(key);

    /**
     * @type {{actionCreator}} actionOptions
     */
    const actionOptions = wrapInObject(actionsOptions[key]);

    const actionCreatorName = camelCase(actionName);
    const actionCreator = isObject(actionOptions) && actionOptions.actionCreator;

    const standardActionCreator = STANDARD_ACTION_CREATORS[key];

    if (actionCreator) {

      memo[actionCreatorName] = actionCreator;

    } else if (standardActionCreator) {
      const _options = resolveOptions(resourceOptions, actionOptions, [
        'url', 'keyBy', 'resourceType', 'urlOnlyParams', 'responseAdaptor', 'progress', 'requestErrorHandler'
      ]);

      const actionCreatorOptions = {
        action: actions.get(key),
        transforms: [],
        name,
        urlOnlyParams: [],
        ..._options
      };

      if (_options.resourceType) {
        actionCreatorOptions.transforms.push(resourceTypeTransform);
      }

      memo[actionCreatorName] = (arg1, arg2, arg3) => standardActionCreator(actionCreatorOptions, arg1, arg2, arg3);

    } else {
      warn(`'${key}' must match the collection of standard action creators (${Object.keys(STANDARD_ACTION_CREATORS).join(', ')}) or define an 'actionCreator' option. Check the options for ${name}`);
    }

    return memo;
  }, {});
}

export default buildActionCreators;
