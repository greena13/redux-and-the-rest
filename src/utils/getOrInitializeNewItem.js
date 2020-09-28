import adaptOptionsForSingularResource from '../action-creators/helpers/adaptOptionsForSingularResource';
import { ITEM } from '../constants/DataStructures';
import { NEW } from '../constants/Statuses';
import { enqueuePendingAction, isActionPending, registerActionEnd } from './ActionQueue';

function getOrInitializeNewItem(options, resourcesState, paramsOrValues, valuesOrActionCreatorOptions, optionalActionCreatorOptions) {
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

  if (!isActionPending(options.action)) {
    enqueuePendingAction(options.action);

    /**
     * We wrap dispatching the action in setTimeout to defer it until the next render cycle, allowing you to
     * use the method in a controller's render method, without triggering a warning from React about updating
     * another component's state while it is rendering
     *
     * Note: The evaluating of whether an action is queued or not must still be done synchronously in order
     *       to work.
     */
    setTimeout(() => {
      options.newItem(values);

      registerActionEnd(options.action);
    }, 0);
  }

  return _newItem;
}

export default getOrInitializeNewItem;
