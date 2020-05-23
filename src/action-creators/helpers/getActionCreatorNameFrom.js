const ACTION_CREATOR_DICT = {
  fetchCollection: 'fetchCollection',
  fetchItem: 'fetchItem',
  clearEdit: 'clearItemEdit',
  clearSelected: 'clearSelectedItems',
  clearItem: 'clearItem',
  clearCollection: 'clearCollection',
  clearAll: 'clearAll'
};

function getActionCreatorNameFrom(actionName) {
  return ACTION_CREATOR_DICT[actionName] || `${actionName}Item`;
}

export default getActionCreatorNameFrom;
