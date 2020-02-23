/**
 * @typedef {Object} ResourceStatus An object containing the status information of a particular resource item
 *          or resource collection.
 * @property {StatusType|null} type The type of the status the resource is in
 */


/**
 * @typedef {Object} ResourceProjection An object containing the projection information of a particular resource
 *         item or resource collection.
 * @property {StatusType|null} type The type of the projection of the of resource
 */

const SHARED_ATTRIBUTES = {
  status: { type: null },
  projection: { type: null }
};


/**
 * @typedef {Object} ResourceValues The attribute values of the resource
 */

/**
 * @typedef {string} ResourceItemId The unique identifier of the resource
 */

/**
 * @typedef {Object} ResourcesItem The state and values of a single item of a particular resource
 * @property {ResourceValues} values The attribute values of the resource item
 * @property {ResourceStatus} status The status information of the resource item
 * @property {ResourceProjection} projection The projection information of the resource item
 */

const ITEM = {
  values: {},
  ...SHARED_ATTRIBUTES,
};

/**
 * @type {ResourcesItem} An empty resource
 */
const RESOURCE = {
  ...ITEM
};

/**
 * @typedef {string} CollectionKey The unique key for a particular collection containing resources of a
 *          particular type.
 */

/**
 * @typedef {Object} ResourcesCollection A collection of a particular resource
 * @property {Array.<ResourceItemId>} positions A list of ids of resources in the order they appear in that
 *          collection.
 * @property {ResourceStatus} status The status information of the resource collection
 */

/**
 * @type {ResourcesCollection} An empty resource collection
 */
const COLLECTION = {
  positions: [],
  ...SHARED_ATTRIBUTES,
};

/**
 * @typedef {Object} ResourcesReduxState The state of the structure in the Redux store that keeps track of all
 *          instances of the same resource type.
 * @property {Object<ResourceItemId, ResourcesItem>} items The set of items of a particular resource type
 * @property {Object<CollectionKey, ResourcesCollection>} collections The set of collections of a particular
 *           resource type
 * @property {Object<ResourceItemId, boolean>} selectionMap A dictionary of the resources that are currently
 *           selected.
 * @property {string|null} newItemKey The temporary key that is being used for a new resource item until it's been
 *           saved to a remote API and given a permanent unique identifier.
 */

/**
 * @typedef {ResourcesReduxState} An empty resource redux state
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
