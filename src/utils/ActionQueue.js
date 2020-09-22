import dig from './object/dig';
import undig from './object/undig';
import undigDelete from './object/undigDelete';

let actionsRegistry = {};

/**
 * Records that an action is already pending and should not be enqueue to be repeated
 * @param {string} actionType The type of action to record as pending
 * @param {string} key The key or id of the action
 * @return {void}
 */
export function enqueuePendingAction(actionType, key = actionType) {
  undig(actionsRegistry, [actionType, key], true);
}

export function registerActionEnd(actionType, key = actionType) {
  undigDelete(actionsRegistry, [actionType, key]);
}

export function isActionPending(actionType, key = actionType) {
  return dig(actionsRegistry, [actionType, key]);
}

/**
 * Clears all records of outstanding requests - only used in testing.
 * @returns {void}
 */
export function clearPendingActions() {
  actionsRegistry = {};
}
