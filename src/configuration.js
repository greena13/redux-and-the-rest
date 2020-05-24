let configuration = {};

/**
 * @typedef {function(Object, Response): {values: Object, error: Object = null}} ResponseAdaptorFunction
 * @param {Object} responseBody The body of the JSON response
 * @param {Response} response The response object itself
 */

/**
 * @typedef GlobalConfigurationOptions
 * @property {string} keyBy The resource attribute used to key/index all items of the current resource type.
 *           This will be the value you pass to each action creator to identify the target of each action. By
 *           default, 'id' is used.
 *
 * @property {boolean} localOnly Set to true for resources that should be edited locally, only. The fetch and
 *           fetchCollection actions are disabled (the fetch* action creators are not exported) and the createItem, updateItem
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
 * @property {Object.<string,*>} request The request configuration object to be passed to the fetch method, or the
 *           new XMLHttpRequest object, when the progress option is used.
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
