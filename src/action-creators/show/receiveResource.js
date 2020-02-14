import { SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getItemKey from '../helpers/getItemKey';

/**
 * Creates an action object to update the Redux store to list a resource item as successfully received from
 * an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object} values The attributes of the resource item
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveResource(options, actionCreatorOptions, values) {
  const { transforms, action, params, keyBy, projection } = options;

  const item = applyTransforms(transforms, options, actionCreatorOptions, {
    ...ITEM,
    values,
    status: { type: SUCCESS, syncedAt: Date.now() },
    projection
  });

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([params, item.values], { keyBy }),
    item
  };
}

export default receiveResource;
