import { SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getItemKey from '../helpers/getItemKey';
import projectionTransform from '../helpers/transforms/projectionTransform';

/**
 * Creates an action object to update the Redux store to list a resource collection as being successfully
 * received from an external API
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @param {Object[]} collection List of resources received from the external API in the response
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function receiveCollection(options, actionCreatorOptions, collection) {
  const { transforms, key, keyBy, action, params } = options;

  const positions = [];

  const syncedAt = Date.now();

  /**
   * Build a dictionary or resource items, correctly indexed by their keys and populate a flat list of
   * what position each item in that collection occupies in the list of resources.
   * @type {Object<CollectionKey, ResourceCollection>}
   */
  const items = collection.reduce((memo, values) => {
    const itemKey = getItemKey([ params, values ], { keyBy });

    /**
     * Push the item's key to the positions list to record where in the list the item is located
     */
    positions.push(itemKey);

    memo[itemKey] = applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: SUCCESS, syncedAt },
    });

    return memo;
  }, {});

  return {
    type: action,
    status: SUCCESS,
    items,
    key,
    collection: projectionTransform(options, actionCreatorOptions, {
      positions,
      status: { type: SUCCESS, syncedAt }
    })
  };

}

export default receiveCollection;
