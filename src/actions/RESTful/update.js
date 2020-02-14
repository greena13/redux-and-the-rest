import getItemKey from '../../action-creators/helpers/getItemKey';
import generateUrl from '../../action-creators/helpers/generateUrl';
import wrapInObject from '../../utils/object/wrapInObject';
import makeRequest from '../../action-creators/helpers/makeRequest';
import assertInDevMode from '../../utils/assertInDevMode';
import warn from '../../utils/dev/warn';
import { ERROR, ITEM, NEW, SUCCESS, UPDATING } from '../..';
import applyTransforms from '../../reducers/helpers/applyTransforms';

/**************************************************************************************************************
 * Action creator thunk
 ***************************************************************************************************************/

function actionCreator(options, params, values, actionCreatorOptions = {}) {
  const {
    action, transforms, url: urlTemplate, name, progress, keyBy, projection
  } = options;

  const key = getItemKey(params, { keyBy });
  const url = generateUrl({ url: urlTemplate, name }, wrapInObject(params, keyBy));

  return (dispatch) => {
    dispatch(
      submitUpdateResource(
        { transforms, action, key, projection },
        actionCreatorOptions,
        values,
        actionCreatorOptions
      )
    );

    return makeRequest({
      ...options,

      previousValues: actionCreatorOptions.previous,
      url,
      key, keyBy, params,
      dispatch,
      credentials: true,
      request: {
        method: 'PUT',
        body: JSON.stringify(values),
      },
      onSuccess: receiveUpdatedResource,
      onError: handleUpdateResourceError,
      progress
    }, actionCreatorOptions);
  };
}

/**************************************************************************************************************
 * Action creators
 ***************************************************************************************************************/

function submitUpdateResource(options, actionCreatorOptions, values) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: UPDATING, key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: UPDATING }
    }),
    previousValues: actionCreatorOptions.previousValues
  };
}

function receiveUpdatedResource(options, actionCreatorOptions, values, previousValues) {
  const { transforms, action, params, keyBy } = options;

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([params, values], { keyBy }),
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: SUCCESS, syncedAt: Date.now() }
    }),
    previousValues
  };
}

function handleUpdateResourceError(options, actionCreatorOptions, httpCode, error) {
  const { action, key } = options;

  return {
    type: action,
    status: ERROR, key,
    httpCode,
    error
  };
}

/**************************************************************************************************************
 * Reducer
 ***************************************************************************************************************/

function reducer(resources, { type, key, status, item, httpCode, error }) {
  const { items } = resources;

  assertInDevMode(() => {
    if (!items[key]) {
      warn(`${type}'s key '${key}' did not match any items in the store. Check the arguments passed to update*(). (Update request still sent to the server.)`);
    } else if (items[key].status.type === NEW) {
      warn(`${type}'s key '${key}' matched a new resource. Use edit*() to modify an item that has not been saved to the server yet. (Update request still sent to the server.)`);
    }
  });

  const currentItem = items[key] || ITEM;

  if (status === UPDATING) {
    const newValues = {
      ...currentItem.values,
      ...item.values
    };

    const newItems = {
      ...items,
      [key]: {
        ...item,
        values: newValues,
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else if (status === SUCCESS) {
    const newValues = {
      ...currentItem.values,
      ...item.values
    };

    const newStatus = {
      ...currentItem.status,
      ...item.status
    };

    const newItems = {
      ...items,
      [key]: {
        ...item,
        values: newValues,
        status: newStatus
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else if (status === ERROR) {

    const newItems = {
      ...items,
      [key]: {
        ...items[key],
        status: {
          type: status,
          httpCode,
          error
        }
      }
    };

    return {
      ...resources,
      items: newItems,
    };

  } else {
    return resources;
  }

}

export default {
  reducer,
  actionCreator,
  localActionCreator: receiveUpdatedResource
};
