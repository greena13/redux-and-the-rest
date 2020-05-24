/**
 * A dictionary of actions that do NOT make sense for singular reosources
 */
const ResourcesOnlyActionsDictionary = {
  fetchCollection: true,
  selectItem: true,
  selectAnotherItem: true,
  deselectItem: true,
  clearSelectedItems: true,
};

export default ResourcesOnlyActionsDictionary;
