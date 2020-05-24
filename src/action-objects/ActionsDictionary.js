import warn from '../utils/dev/warn';
import constantize from '../utils/string/constantize';
import toPlural from '../utils/string/toPlural';
import toSingular from '../utils/string/toSingular';
import RemoteOnlyActionsDictionary from '../constants/RemoteOnlyActionsDictionary';

/**
 * @typedef {string} RestfulActionName One of the RESTful action names (fetchCollection, fetch, new, create, editItem, update,
 *          destroy)
 */

/**
 * @typedef {string} CustomActionName The name of a custom action
 */

/**
 * @typedef {RestfulActionName|CustomActionName} ActionType The name of an action to be performed on a resource
 */

/**
 * @typedef {string} ActionType The type of Redux action that is emitted when that action occurs
 */

/**
 * @typedef {Object<ActionType, ActionType>} ActionDictionary Mapping between action names and their types
 */

/**
 * Dictionary of standard actions
 * @type {ActionDictionary}
 */
const STANDARD_ACTIONS = {

  /**
   * RESTful actions
   */
  fetchCollection: 'FETCH_ITEMS',
  fetchItem: 'FETCH_ITEM',
  new: 'NEW_ITEM',
  clearNew: 'CLEAR_NEW_ITEM',
  editNewItem: 'EDIT_NEW_ITEM',
  clearItemEdit: 'CLEAR_ITEM_EDIT',
  create: 'CREATE_ITEM',
  editItem: 'EDIT_ITEM',
  update: 'UPDATE_ITEM',
  destroy: 'DESTROY_ITEM',

  /**
   * Clearing
   */
  clearItem: 'CLEAR_ITEM',
  clearCollection: 'CLEAR_ITEMS',
  clearResource: 'CLEAR_ALL_ITEMS',

  /**
   * Selection actions
   */
  select: 'SELECT_ITEM',
  selectAnother: 'SELECT_ANOTHER_ITEM',
  deselect: 'DESELECT_ITEM',
  clearSelected: 'CLEAR_SELECTED_ITEMS',
};


/**
 * Generates the name of an action, substituting the name of a resource into a generalized template string
 * @param {string} resourceName The name of the resource
 * @param {string} actionAlias The alias of the general action
 * @returns {string} A constant that can use used as the action name for the specific action and resource
 */
function getActionName(resourceName, actionAlias) {
  const standardAction = STANDARD_ACTIONS[actionAlias];

  if (standardAction) {
    if (standardAction.indexOf('ITEMS') === -1) {
      return standardAction.replace('ITEM', constantize(toSingular(resourceName)));
    } else {
      return standardAction.replace('ITEMS', constantize(toPlural(resourceName)));
    }
  } else {
    return `${constantize(actionAlias)}_${constantize(resourceName)}`;
  }
}

/**
 * Dictionary of actions names to action type constants
 */
class ActionsDictionary {
  constructor (name, resourceOptions, actionList = []) {
    this.actionsMap = {};

    actionList.forEach((action) => {

      /**
       * We don't export certain actions when the localOnly option is used (as they don't make sense in
       * a local context).
       *
       * See RemoteOnlyActionsDictionary for a full list of actions that are excluded when the localOnly
       * option is used.
       */
      if (resourceOptions.localOnly && RemoteOnlyActionsDictionary[action]) {
        return;
      }

      this.actionsMap[action] = getActionName(name, action);
    });
  }

  get(actionKey) {
    const action = this.actionsMap[actionKey];

    if (!action) {
      warn(`Action ${actionKey} does not exist.`);
    }

    return action;
  }

  /**
   * Generates the resource's ActionDictionary
   * @returns {ActionDictionary} A dictionary of the resource's available actions
   */
  toHash() {
    return this.actionsMap;
  }
}

export default ActionsDictionary;
