/**
 * The default options to use unless overridden by calling the configure() or resources() functions
 */
import DefaultKey from './constants/DefaultKey';

const DefaultConfigurationOptions = {

  /**
   * Index objects by the DefaultKey unless otherwise specified
   */
  keyBy: DefaultKey,

  /**
   * Don't call any functions before passing response objects back to the reducers, by default
   */
  beforeReducers: [],

  /**
   * Don't call any functions after passing response objects back to the reducers, by default
   */
  afterReducers: [],

  /**
   * The attributes present at the root of responses that indicate an error and/or contain information
   * about that error
   */
  errorAttributes: ['error'],

  /**
   * Don't perform any transforms on the action objects, by default
   */
  transforms: [],

  /**
   * Don't assume any params are for urls only, by default
   */
  urlOnlyParams: [],

  /**
   * Assume a default content-type of application/json
   */
  contentType: 'application/json',

  /**
   * Set of options passed to query-string when serializing query strings
   * @see https://www.npmjs.com/package/query-string
   */
  queryStringOptions: {},

  /**
   * The key to use use as a wildcard to mean all lists
   */
  listWildcard: '*',
};

let configuration = {
  ...DefaultConfigurationOptions
};

/**
 * @typedef {function(Object, Response): {values: Object, error: Object = null, errors: Array.<Object> = [], metadata: Object }}>}} ResponseAdaptorFunction
 * @param {Object} responseBody The body of the JSON response
 * @param {Response} response The raw Response object
 * @returns {{values: Object, error: Object = null, errors: Array.<Object> = [], metadata: Object }}}
 */

/**
 * @typedef GlobalConfigurationOptions
 * @property {string} keyBy The resource attribute used to key/index all items of the current resource type.
 *           This will be the value you pass to each action creator to identify the target of each action. By
 *           default, 'id' is used.
 *
 * @property {boolean} localOnly Set to true for resources that should be edited locally, only. The fetch and
 *           fetchList actions are disabled (the fetch* action creators are not exported) and the createItem, updateItem
 *           and destroyItem only update the store locally, without making any HTTP requests.
 * @property {string[]} urlOnlyParams The attributes passed to action creators that should be used to create the request URL,
 *           but ignored when storing the request's response.
 * @property {ResponseAdaptorFunction} responseAdaptor Function used to adapt the response for a particular
 *           request before it is handed over to the reducers. The function must return the results as an object
 *           with properties: values and (optionally) error.
 * @property {Function} requestAdaptor Function used to adapt the JavaScript object before it is handed over to
 *           become the body of the request to be sent to an external API.
 * @property {RequestCredentials} credentials Whether to include, omit or send cookies that may be stored in
 *           the user agent's cookie jar with the request only if it's on the same origin.
 * @property {String} acceptType The Accept header to use with each request. Defaults to the contentType if not
 *            defined.
 * @property {String} contentType The Content-Type header to use with each request
 * @property {String} errorContentType The Content-Type of error responses that should be parsed as JSON. Defaults
 *            to the contentType if not defined.
 * @property {Object} queryStringOptions Set of options passed to query-string when serializing query strings
 * @property {Object.<string,*>} request The request configuration object to be passed to the fetch method, or the
 *           new XMLHttpRequest object, when the progress option is used.
 *
 * @property {String} listWildcard The key to use use as a wildcard to mean all lists
 *
 * @property {Array.<ReducerFunction>} beforeReducers A list of functions to call before passing the resource to
 *           the reducer. This is useful if you want to use the default reducer, but provide some additional
 *           pre-processing to standardise the resource before it is added to the store.
 * @property {Array.<ReducerFunction>} afterReducers A list of functions to call after passing the resource to
 *           the reducer. This is useful if you want to use the default reducer, but provide some additional
 *           post-processing to standardise the resource before it is added to the store.
 *
 * @property {Store} store The Redux store, used to directly invoke dispatch and get state.
 */

/**
 * Updates or sets the global configuration options
 * @param {GlobalConfigurationOptions} customConfiguration Configuration options to merge with the default
 *        configuration values
 * @returns {void}
 */
export function setConfiguration(customConfiguration) {
  configuration = {
    ...configuration,
    ...customConfiguration
  };
}

/**
 * Returns the current global configuration options
 * @returns {GlobalConfigurationOptions} The current global configuration options
 */
export function getConfiguration() {
  return configuration;
}
