import warn from '../utils/dev/warn';
import constantize from '../utils/string/constantize';
import toPlural from '../utils/string/toPlural';
import toSingular from '../utils/string/toSingular';
import RemoteOnlyActionsDictionary from '../constants/RemoteOnlyActionsDictionary';

/**
 * @typedef {String} RestfulActionName One of the RESTful action names (index, show, new, create, edit, update,
 *          destroy)
 */

/**
 * @typedef {String} CustomActionName The name of a custom action
 */

/**
 * @typedef {RestfulActionName|CustomActionName} ActionType The name of an action to be performed on a resource
 */

/**
 * @typedef {String} ActionType The type of Redux action that is emitted when that action occurs
 */

/**
 * @typedef {Object<ActionType, ActionType>} ActionDictionary Mapping between action names and their types
 */

/**
 * Dictionary of standard actions
 * @type {ActionDictionary}
 */
const STANDARD_ACTIONS = {
  index: 'FETCH_ITEMS',
  show: 'FETCH_ITEM',
  select: 'SELECT_ITEM',
  selectAnother: 'SELECT_ANOTHER_ITEM',
  deselect: 'DESELECT_ITEM',
  clearSelected: 'CLEAR_SELECTED_ITEMS',
  new: 'NEW_ITEM',
  clearNew: 'CLEAR_NEW_ITEM',
  create: 'CREATE_ITEM',
  edit: 'EDIT_ITEM',
  update: 'UPDATE_ITEM',
  destroy: 'DESTROY_ITEM'
};

/**
 * Factory for creating the ActionDictionary for a resource's actions
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

      this.actionsMap[action] = function(){
        const standardAction = STANDARD_ACTIONS[action];

        if (standardAction) {
          if (standardAction.indexOf('ITEMS') === -1) {
            return standardAction.replace('ITEM', constantize(toSingular(name)));
          } else {
            return standardAction.replace('ITEMS', constantize(toPlural(name)));
          }
        } else {
          return `${constantize(action)}_${constantize(name)}`;
        }
      }();
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
