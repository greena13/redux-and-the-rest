import warn from '../utils/dev/warn';
import constantize from '../utils/string/constantize';
import toPlural from '../utils/string/toPlural';
import toSingular from '../utils/string/toSingular';

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

class Actions {
  constructor (name, actionList = []) {
    this.actionsMap = {};

    actionList.forEach((action) => {
       this.actionsMap[action] = function(){
         const standardAction = STANDARD_ACTIONS[action];

         if (standardAction) {
           if (standardAction.indexOf('ITEMS') !== -1) {
             return standardAction.replace('ITEMS', constantize(toPlural(name)));
           } else {
             return standardAction.replace('ITEM', constantize(toSingular(name)));
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
      warn(`Action ${actionKey} does not exist.`)
    }

    return action;
  }

  toHash() {
    return this.actionsMap;
  }
}

export default Actions;
