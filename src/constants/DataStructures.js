/**
 * @typedef {Object} ResourceStatus An object containing the status information of a particular resource item
 *          or resource collection.
 * @property {StatusType|null} type The type of the status the resource is in
 */

const SHARED_ATTRIBUTES = {
  status: { type: null },
};


/**
 * @typedef {Object} ResourceValues The attribute values of the resource
 */

/**
 * @typedef {String} ResourceId The unique identifier of the resource
 */

/**
 * @typedef {Object} ResourceItem The state and values of a single item of a particular resource
 * @property {ResourceValues} values The attribute values of the resource item
 * @property {ResourceStatus} status The status information of the resource item
 */

const ITEM = {
  values: {},
  ...SHARED_ATTRIBUTES,
};

/**
 * @type {ResourceItem} An empty resource
 */
const RESOURCE = {
  ...ITEM
};

/**
 * @typedef {String} CollectionKey The unique key for a particular collection containing resources of a
 *          particular type.
 */

/**
 * @typedef {Object} ResourceCollection A collection of a particular resource
 * @property {Array<ResourceId>} positions A list of ids of resources in the order they appear in that
 *          collection.
 * @property {ResourceStatus} status The status information of the resource collection
 */

/**
 * @type {ResourceCollection} An empty resource collection
 */
const COLLECTION = {
  positions: [],
  ...SHARED_ATTRIBUTES,
};

/**
 * @typedef {Object} ResourcesReduxState The state of the structure in the Redux store that keeps track of all
 *          instances of the same resource type.
 * @property {Object<ResourceId, ResourceItem>} items The set of items of a particular resource type
 * @property {Object<CollectionKey, ResourceCollection>} collections The set of collections of a particular
 *           resource type
 * @property {Object<ResourceId,Boolean>} selectionMap A dictionary of the resources that are currently
 *           selected.
 * @property {String} newItemKey The temporary key that is being used for a new resource item until it's been
 *           saved to a remote API and given a permanent unique identifier.
 */

/**
 * @type {ResourcesReduxState} An empty resource redux state
 */
const RESOURCES = {
  items: {},
  collections: {},
  selectionMap: {},
  newItemKey: null,
};

export {
  RESOURCE,
  RESOURCES,
  COLLECTION,
  ITEM,
};
