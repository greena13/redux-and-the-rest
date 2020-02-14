import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import wrapInObject from '../../utils/object/wrapInObject';
import makeRequest from '../../action-creators/helpers/makeRequest';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import { DESTROY_ERROR, DESTROYING, ITEM, NEW, SUCCESS } from '../..';
import removeItemsFromResources from '../../reducers/helpers/removeItemsFromResources';
import isEmpty from '../../utils/collection/isEmpty';
import applyTransforms from '../../reducers/helpers/applyTransforms';

/**************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

function actionCreator(options, params, actionCreatorOptions = {}) {
  const {
    action,
    name,
    keyBy,
    url: urlTemplate,
    progress
  } = options;

  const key = getItemKey(params, { keyBy });
  const url = generateUrl({ url: urlTemplate, name }, wrapInObject(params, keyBy));

  return (dispatch) => {
    dispatch(deleteResourceUpdate({ action, key }, actionCreatorOptions));

    return makeRequest({
      ...options,

      url, key,
      previousValues: actionCreatorOptions.previous,
      dispatch,
      credentials: true,
      request: {
        method: 'delete',
      },
      onSuccess: removeResource,
      onError: handleDestroyResourceError,
      progress
    }, actionCreatorOptions);
  };
}

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

function deleteResourceUpdate(options, previousValues) {
  const { action, key } = options;

  return {
    type: action,
    status: DESTROYING, key,
    previousValues: isEmpty(previousValues) ? null : previousValues
  };
}

function removeResource(options, previousValues) {
  const { action, key } = options;

  return {
    type: action,
    status: SUCCESS, key,
    previousValues
  };
}

function handleDestroyResourceError(options, actionCreatorOptions, httpCode, error) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: DESTROY_ERROR, key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      status: {
        type: DESTROY_ERROR,
        httpCode,
        error
      },
    })
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

function reducer(resources, { type, status, key, item }) {
  assertInDevMode(() => {
    if (!resources.items[key]) {
      warn(`${type}'s key '${key}' did not match any items in the store. (Destroy request was still sent to the server.)`);
    }
  });

  const currentItem = resources.items[key] || ITEM;

  if (status === DESTROYING) {
    assertInDevMode(() => {
      if (currentItem.status.type === NEW) {
        warn(`${type}'s key '${key}' matched a new item. Use clearNew*() to clear items that haven't been saved to the server. (Destroy request was still sent to the server.)`);
      }

      if (currentItem.status.type === DESTROYING) {
        warn(`${type}'s key '${key}' matched a new that has a pending DESTROY action. (Duplicate destroy request was still sent to the server.)`);
      }
    });

    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...currentItem,
          status: {
            type: status
          }
        }
      }
    };
  } else if (status === SUCCESS) {
    return removeItemsFromResources(resources, key);
  } else if (status === DESTROY_ERROR) {
    return {
      ...resources,
      items: {
        ...resources.items,
        [key]: {
          ...currentItem,
          ...item
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
  localActionCreator: removeResource
};
