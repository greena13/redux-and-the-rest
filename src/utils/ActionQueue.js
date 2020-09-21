import hasKey from './object/hasKey';

let actionsRegistry = {};

/**
 * Records that an action is already pending and should not be enqueue to be repeated
 * @param {string} actionType The type of action to record as pending
 * @return {void}
 */
export function enqueuePendingAction(actionType) {
  actionsRegistry[actionType] = true;
}

export function registerActionEnd(actionType) {
  Reflect.deleteProperty(actionsRegistry, actionType);
}

export function isActionPending(actionType) {
  return hasKey(actionsRegistry, actionType);
}

/**
 * Clears all records of outstanding requests - only used in testing.
 * @returns {void}
 */
export function clearPendingActions() {
  actionsRegistry = {};
}
