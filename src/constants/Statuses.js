/**
 * @typedef {String} StatusType One of the statuses a resource item or resource collection can be in
 */

/**
 * The status used when a resource item or collection has been successfully synchronised with an external API
 * @type {string}
 */
const SUCCESS = 'SUCCESS';

/**
 * The status used when a resource item or collection has is being uploaded or downloaded from an external API
 * @type {string}
 */
const PROGRESS = 'PROGRESS';

/**
 * The status used when a resource item or collection failed to synchronise with an external API
 * @type {string}
 */
const ERROR = 'ERROR';

/**
 * The status used when a resource item is being edited
 * @type {string}
 */
const EDITING = 'EDITING';

/**
 * The status used when a resource item or collection is being synchronised with an external API
 * @type {string}
 */
const FETCHING = 'FETCHING';

/**
 * The status used when a new resource item is being saved to an external API for the first time
 * @type {string}
 */
const CREATING = 'CREATING';

/**
 * The status used when an edited resource item is being saved to an external API
 * @type {string}
 */
const UPDATING = 'UPDATING';

/**
 * The status used when a resource item is being deleted on an external API
 * @type {string}
 */
const DESTROYING = 'DESTROYING';

/**
 * The status used when a resource item failed to be deleted from an external API
 * @type {string}
 */
const DESTROY_ERROR = 'DESTROY_ERROR';

/**
 * The status used when a new resource item has not yet been saved to an external API
 * @type {string}
 */
const NEW = 'NEW';

export {
  NEW,
  EDITING,

  FETCHING,
  CREATING,
  UPDATING,

  DESTROYING,
  DESTROY_ERROR,

  SUCCESS,
  PROGRESS,
  ERROR,
};
