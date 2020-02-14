import { FETCHING } from '../../constants/Statuses';
import { COLLECTION } from '../../constants/DataStructures';
import { COMPLETE } from '../../constants/ProjectionTypes';

/**
 * Creates an action object to update the Redux store to list a resource collection as FETCHING
 * @param {Object} options Options specified when defining the resource and action
 * @param {string} key Key to use to index the collection in the Redux store
 * @returns {ActionObject} Action Object that will be passed to the reducers to update the Redux state
 */
function requestCollection(options, key) {
  const { action, projection = { type: COMPLETE } } = options;

  return {
    type: action,
    status: FETCHING,
    collection: {
      ...COLLECTION,
      status: { type: FETCHING },
      projection: projection
    },
    key,
  };
}

export default requestCollection;
