const ACTION_CREATOR_DICT = {
  fetchCollection: 'fetchCollection',
  fetchItem: 'fetchItem',
  editItem: 'editItem',
  editNewItem: 'editNewItem',
  clearItemEdit: 'clearItemEdit',
  clearSelected: 'clearSelectedItems',
  clearItem: 'clearItem',
  clearCollection: 'clearCollection',
  clearResource: 'clearResource'
};

function getActionCreatorNameFrom(actionName) {
  return ACTION_CREATOR_DICT[actionName] || `${actionName}Item`;
}

export default getActionCreatorNameFrom;
