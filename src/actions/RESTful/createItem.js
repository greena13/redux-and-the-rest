import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import wrapInObject from '../../utils/object/wrapInObject';
import extractListOperations from '../../action-creators/helpers/extractListOperations';
import makeRequest from '../../action-creators/helpers/makeRequest';
import { LIST, ITEM } from '../../constants/DataStructures';
import { CREATING, ERROR, NEW, SUCCESS } from '../../constants/Statuses';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import applyListOperators from '../../reducers/helpers/applyListOperators';
import without from '../../utils/list/without';
import replace from '../../utils/list/replace';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getItem from '../../utils/getItem';
import isUndefined from '../../utils/isUndefined';
import mergeStatus from '../../reducers/helpers/mergeStatus';
import { isRequestInProgress, registerRequestStart } from '../../utils/RequestManager';
import nop from '../../utils/function/nop';
import EmptyKey from '../../constants/EmptyKey';
import { isNew } from '../../index';
import adaptOptionsForSingularResource from '../../action-creators/helpers/adaptOptionsForSingularResource';

const HTTP_REQUEST_TYPE = 'POST';

/** ************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/


/**
 * @typedef {RemoteActionCreatorOptionsWithMetadata} CreateItemActionCreatorOptions
 *
 * @property {Object} [previousValues] The values of the resource item being updated, to allow more efficiently
 *          updating associated items.
 * @property {string[]} [push=[]]  An array of list keys to push the new item to the end of.
 * @property {string[]} [unshift=[]]  An array of list keys to add the new item to the beginning of.
 * @property {string[]} [invalidate=[]]  An array of list keys for which to clear (invalidate). This is useful
 *           for when you know the item that was just created is likely to appear in a list, but you don't know
 *           where, so you need to re-retrieve the whole list from the server.
 */

/**
 * Redux action creator used for sending a CREATE request to a RESTful API endpoint
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} paramsOrValues The first argument which can either a string or object that is serialized
 *        and used to fill in the dynamic parameters of the resource's URL (params) or the attribute values to
 *        use to create the resource.
 * @param {Object|CreateItemActionCreatorOptions} valuesOrActionCreatorOptions Either be the values used by the action
 *        creator, or addition options passed to the action creator when it is called.
 * @param {CreateItemActionCreatorOptions} [optionalActionCreatorOptions=undefined] The optional additional options passed to the action controller.
 * @returns {Thunk} Function to call to dispatch an action
 */
function actionCreator(options, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const {
    action,
    transforms,
    url: urlTemplate,
    urlOnlyParams,
    keyBy,
    progress,
    metadata,
    requestAdaptor,
    request = {},
    singular
  } = options;

  const { params, values, actionCreatorOptions } =
    adaptOptionsForSingularResource({ paramsOptional: true, acceptsValues: true }, [
      paramsOrValues,
      valuesOrActionCreatorOptions,
      optionalActionCreatorOptions
    ]);

  const normalizedParams = wrapInObject(params, keyBy);

  const url = generateUrl({ urlTemplate, keyBy, ignoreOptionalParams: true }, normalizedParams);

  if (actionCreatorOptions.force || isRequestInProgress(HTTP_REQUEST_TYPE, url)) {
    return nop;
  } else {
    registerRequestStart(HTTP_REQUEST_TYPE, url);
  }

  const key = function () {
    const specifiedKey = getItemKey([normalizedParams, values], { keyBy, singular });

    if (specifiedKey || specifiedKey === EmptyKey) {
      return specifiedKey;
    } else {

      /**
       * We automatically generate a new temporary Id if one is not specified
       */
      return Date.now().toString();
    }
  }();

  return (dispatch) => {
    const listOperations = extractListOperations(actionCreatorOptions, urlOnlyParams);
    const requestedAt = Date.now();

    dispatch(
      submitCreateResource({ action, transforms, key, metadata, requestedAt }, actionCreatorOptions, values, listOperations)
    );

    return makeRequest({
      ...options,
      key,
      params: normalizedParams,
      listOperations,
      url,
      requestedAt,
      dispatch,
      request: {
        method: HTTP_REQUEST_TYPE,
        body: JSON.stringify(requestAdaptor ? requestAdaptor(values) : values),
        ...request,
      },
      onSuccess: receiveCreatedResource,
      onError: handleCreateResourceError,
      progress
    }, actionCreatorOptions);
  };
}

/** ************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

/**
 * Creates an action object to update the Redux store to list a new resource item as being created on a remote API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} [actionCreatorOptions={}] The options passed to the createItem* action creator function
 * @param {Object} values The attributes of the resource currently being created
 * @param {Object} [listOperations={}] Options for how the newly created resource should be added to an
 *        existing lists - if any.
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function submitCreateResource(options, actionCreatorOptions, values, listOperations) {
  const { transforms, action, key, requestedAt } = options;

  /**
   * Action creator options override metadata options that may have been set when defining the resource
   */
  const metadata = actionCreatorOptions.metadata || options.metadata;

  return {
    type: action,
    status: CREATING,
    temporaryKey: key,
    listOperations,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: CREATING, requestedAt },
      metadata
    })
  };
}

/**
 * Redux action creator used for creating a request item in the Redux store without sending any requests to an
 * external API
 * @param {Object} options Configuration options built from those provided when the resource was defined
 * @param {Object|string} paramsOrValues The first argument which can either a string or object that is serialized
 *        and used to fill in the dynamic parameters of the resource's URL (params) or the attribute values to
 *        use to create the resource.
 * @param {Object} valuesOrActionCreatorOptions Either be the values used by the action creator, or addition
 *        options passed to the action creator when it is called.
 * @param {Object} [optionalActionCreatorOptions=undefined] The optional additional options passed to the
 *        action controller.
 * @returns {Object} Action Object that will be passed to the reducers to update the Redux state
 */
function localActionCreator(options, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
  const { params, values, actionCreatorOptions } =
    adaptOptionsForSingularResource({ paramsOptional: true, acceptsValues: true }, [
      paramsOrValues,
      valuesOrActionCreatorOptions,
      optionalActionCreatorOptions
    ]
  );

  /**
   * Action creator options override metadata options that may have been set when defining the resource
   */
  const metadata = actionCreatorOptions.metadata || options.metadata;

  return receiveCreatedResource({ ...options, params }, actionCreatorOptions, values, metadata);
}

/**
 * Creates an action object to update the Redux store to list a resource item as having been confirmed as created
 * by an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object} values The values returned by the external API for the newly created resource item
 * @param {Object} [metadata] Metadata extracted from the response, using a responseAdaptor (if applicable)
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveCreatedResource(options, actionCreatorOptions, values, metadata) {
  const { action, keyBy, transforms, params, listOperations, localOnly, singular } = options;

  const key = function () {
    const normalizedParams = wrapInObject(params, keyBy);

    const specifiedKey = getItemKey([values, normalizedParams], { keyBy, singular });

    if (isUndefined(specifiedKey)) {
      assertInDevMode(() => {
        warn(
          'createItem() did not specify a temporary key. One has been generated and stored in ' +
          'newItemKey, but unless you save a reference to it, it will be lost when you create the next item. ' +
          'It\'s therefore recommended when using the localOnly option to always specify a key by passing it ' +
          'as the first argument to createItem.'
        );
      });

      /**
       * We automatically generate a new temporary Id if one is not specified
       */
      return Date.now().toString();
    } else {
      return specifiedKey;
    }
  }();

  return {
    type: action,
    status: SUCCESS,
    key,
    temporaryKey: options.key,
    listOperations,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: SUCCESS, syncedAt: Date.now() },
      metadata
    }),
    localOnly
  };
}

/**
 * Creates an action object to update the Redux store to mark a resource item as errored when the request to
 * created it on the external API failed
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {number} httpCode The HTTP status code of the error response
 * @param {object} errorEnvelope An object containing the details of the error
 * @param {Object} [metadata] Metadata extracted from the response, using a responseAdaptor (if applicable)
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function handleCreateResourceError(options, actionCreatorOptions, httpCode, errorEnvelope, metadata) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR,
    temporaryKey: key,

    /**
     * metadata from a responseAdaptor (if applicable) to be merged in with the existing metadata
     */
    metadata,
    httpCode,
    ...errorEnvelope,
    errorOccurredAt: Date.now()
  };
}

/** ************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

/**
 * Handles reducing a resource item in a Redux store as it moves through the stages of it creation
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources item
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const {
    localOnly, type, temporaryKey, key, listOperations = {},
    status, item, httpCode, error, errors, errorOccurredAt, metadata
  } = action;

  const { items } = resources;
  const currentItem = items[temporaryKey] || ITEM;

  if (status === CREATING) {
    assertInDevMode(() => {
      if (!isNew(currentItem)) {
        warn(
          `${type} has the same key '${temporaryKey}' as an existing item. ` +
          'Use updateItem() to update an existing item, ' +
          'or ensure the new item has a unique temporary key. (The create request was still sent to the server.)'
        );
      }
    });

    /**
     * If the newItemKey points to a resource item of type NEW, then we clear it, to be replaced by the resource
     * item that is now being created.
     *
     * We can't always clear the item pointed to by newItemKey because this attribute is used to point to
     * resource items after they have been created. So if if we created two items one after another, the first
     * would be removed from the store when the second was created.
     */
    const itemsToPersist = function () {
      if (getItem(resources, resources.newItemKey).status.type === NEW) {
        return without(items, resources.newItemKey);
      } else {
        return items;
      }
    }();

    /**
     * If a new resource is being added to the store as CREATING (we're waiting for a remote API to confirm its
     * creation), we add it to the repository of items with a temporary id until a permanent one can assigned
     * by a remote API.
     */
    const newItems = {
      ...itemsToPersist,
      [temporaryKey]: {
        ...currentItem,
        ...item,

        /**
         * We persist the syncedAt attribute of the list if it's been fetched in the past, in case
         * the request fails, we know the last time it was successfully synced
         */
        status: mergeStatus(currentItem.status, item.status, { onlyPersist: ['syncedAt'] }),
      }
    };

    return {
      ...resources,
      items: newItems,

      /**
       * We add the new item (using its temporary id) to any lists that already exist in the store,
       * that the new item should be a part of - according to the listOperations specified.
       */
      lists: applyListOperators(resources.lists, listOperations, temporaryKey),
      newItemKey: temporaryKey
    };

  } else if (status === SUCCESS) {
    const itemsToPersist = function () {
      if (localOnly && getItem(resources, resources.newItemKey).status.type === NEW) {

        /**
         * When in localOnly mode, there is no remote API call, so the CREATING step is skipped and the SUCCESS
         * is the first to happen. If so, we check if there is an existing resource item in the NEW status, and
         * clear it, so when a user NEWs a resource and then CREATEs it and doesn't specify a temporary
         * id (leaving one to be automatically generated each time), the original NEW resource item is properly
         * cleaned up.
         */
        return without(items, resources.newItemKey);
      } else {

        /**
         * Once the remote API has confirmed the creation of the new resource item (and assigned it a permanent id),
         * we replace the one in the local Redux store with the values the remote API sends back in the response,
         * and we index them under the new permanent id.
         */
        return without(items, temporaryKey);
      }
    }();

    const newItems = {
      ...itemsToPersist,
      [key]: {
        ...item,

        /**
         * We add all status attributes that were added since the request was started (currently only the
         * syncedAt value).
         */
        status: mergeStatus(currentItem.status, item.status),

        /**
         * For metadata extracted from the response, we merge it with the existing metadata already available
         */
        metadata: { ...currentItem.metadata, ...item.metadata }
      }
    };

    return {
      ...resources,
      items: newItems,
      lists: {
        ...resources.lists,

        /**
         * We update an usage of the temporary id in any of the lists the item appeared in, replacing
         * them with the new permanent id
         */
        ...([].concat(...Object.values(listOperations))).reduce((memo, id) => {
          const list = resources.lists[id] || LIST;
          const { positions } = list;

          memo[id] = {
            ...list,
            positions: replace(positions, temporaryKey, key)
          };

          return memo;
        }, {})
      },

      newItemKey: key,
    };
  } else if (status === ERROR) {

    /**
     * If the resource item fails to create with the remote API, we leave the resource item where it is, change
     * it's status to ERROR, and merge in any error details
     */
    return {
      ...resources,
      items: {
        ...items,
        [temporaryKey]: {
          ...currentItem,

          /**
           * We merge in new status attributes about the details of the error.
           */
          status: mergeStatus(currentItem.status, {
            type: status,
            httpCode,
            error, errors, errorOccurredAt
          }),

          /**
           * For metadata extracted from the response, we merge it with the existing metadata already available
           */
          metadata: { ...currentItem.metadata, ...metadata }
        }
      }
    };
  } else {
    return resources;
  }
}

export default {
  reducer,
  actionCreator,
  localActionCreator
};
