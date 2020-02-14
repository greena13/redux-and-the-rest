import { ITEM } from '../../constants/DataStructures';
import { FETCHING } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

/**
 * Creates an action object to update the Redux store to list a resource item as FETCHING
 * @param {Object} options Options specified when defining the resource and action
 * @param {Object} actionCreatorOptions Options passed to the action creator
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function requestResource(options, actionCreatorOptions) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: FETCHING,
    key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values: { },
      status: { type: FETCHING }
    })
  };
}

export default requestResource;
