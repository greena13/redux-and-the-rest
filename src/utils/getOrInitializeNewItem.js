import { getConfiguration } from '../configuration';
import assertInDevMode from './assertInDevMode';
import warn from './dev/warn';
import adaptOptionsForSingularResource from '../action-creators/helpers/adaptOptionsForSingularResource';
import { ITEM } from '../constants/DataStructures';
import { NEW } from '../constants/Statuses';

function getOrInitializeNewItem(options, resourcesState, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {

  /**
   * Retrieve the direct connection to the Redux store the user is expected to set using the configure() function
   */
  const { store } = getConfiguration();

  assertInDevMode(() => {
    if (!store) {
      warn('Cannot use getOrInitializeItem() without setting the store instance using the configure() function.');
    }
  });

  const { values } =
    adaptOptionsForSingularResource({ paramsOptional: true, acceptsValues: true }, [
      paramsOrValues,
      valuesOrActionCreatorOptions,
      optionalActionCreatorOptions
    ]);

  const key = resourcesState.newItemKey;

  const existingItem = resourcesState.items[key];

  if (existingItem) {
    return existingItem;
  }

  const _newItem = { ...ITEM, values, status: { ...ITEM.status, type: NEW } };

  /**
   * We wrap dispatching the action in setTimeout to defer it until the next render cycle, allowing you to
   * use the method in a controller's render method, without triggering a warning from React about updating
   * another component's state while it is rendering
   */
  setTimeout(() => {
    if (store) {
      store.dispatch(options.newItem(values));
    }
  }, 0);


  return _newItem;
}

export default getOrInitializeNewItem;
