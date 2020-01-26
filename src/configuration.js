let configuration = {};

/**
 * @typedef GlobalConfigurationOptions
 * @property {string} keyBy The resource attribute used to key/index all items of the current resource type.
 *           This will be the value you pass to each action creator to identify the target of each action. By
 *           default, 'id' is used.
 *
 * @property {boolean} localOnly Set to true for resources that should be edited locally, only. The show and
 *           index actions are disabled (the fetch* action creators are not exported) and the create, update
 *           and destroy only update the store locally, without making any HTTP requests.
 * @property {string[]} urlOnlyParams The attributes passed to action creators that should be used to create the request URL,
 *           but ignored when storing the request's response.
 * @property {Function} responseAdaptor Function used to adapt the responses for requests before it is handed
 *           over to the reducers.
 *
 * @property {Array<ReducerFunction>} beforeReducers A list of functions to call before passing the resource to
 *           the reducer. This is useful if you want to use the default reducer, but provide some additional
 *           pre-processing to standardise the resource before it is added to the store.
 * @property {Array<ReducerFunction>} afterReducers A list of functions to call after passing the resource to
 *           the reducer. This is useful if you want to use the default reducer, but provide some additional
 *           post-processing to standardise the resource before it is added to the store.
 */

/**
 * Updates or sets the global configuration options
 * @param {GlobalConfigurationOptions} customConfiguration
 */
export function setConfiguration(customConfiguration) {
  configuration = {
    ...configuration,
    customConfiguration
  };
}

/**
 * Returns the current global configuration options
 * @returns {GlobalConfigurationOptions}
 */
export function getConfiguration() {
  return { ...configuration };
}
