import editNewItem from './editNewItem';
import editItem from './editItem';
import isNew from '../../public-helpers/isNew';

/**
 * Handles reducing a new or existing resource item in a Redux store as it's edited (perhaps over multiple stages).
 * @param {ResourcesReduxState} resources The current state of part of the Redux store that contains
 *        the resources
 * @param {ActionObject} action The action containing the data to update the resource state
 * @returns {ResourcesReduxState} The new resource state
 */
function reducer(resources, action) {
  const currentItem = resources.items[action.key || resources.newItemKey];

  if (isNew(currentItem)) {
    return editNewItem.reducer(resources, action);
  }

  return editItem.reducer(resources, action);
}

export default {
  reducer,
  actionCreator: editItem.actionCreator,
};
