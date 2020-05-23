/**
 * A dictionary of actions that do NOT make sense for singular reosources
 */
const ResourcesOnlyActionsDictionary = {
  fetchCollection: true,
  select: true,
  selectAnother: true,
  deselect: true,
  clearSelected: true,
};

export default ResourcesOnlyActionsDictionary;
