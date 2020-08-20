import warn from '../utils/dev/warn';
import isObject from '../utils/object/isObject';
import wrapInObject from '../utils/object/wrapInObject';
import resolveOptions from './helpers/resolveOptions';
import { getConfiguration } from '../configuration';
import RemoteOnlyActionsDictionary from '../constants/RemoteOnlyActionsDictionary';
import fetchItemAction from '../actions/RESTful/fetchItem';
import fetchListAction from '../actions/RESTful/fetchList';
import newAction from '../actions/RESTful/newItem';
import clearNewItemAction from '../actions/RESTful/clearNewItem';
import editNewItemAction from '../actions/RESTful/editNewItem';
import editNewOrExistingItemItemAction from '../actions/RESTful/editNewOrExistingItem';
import createItemAction from '../actions/RESTful/createItem';
import editAction from '../actions/RESTful/editItem';
import clearItemEditAction from '../actions/RESTful/clearItemEdit';
import updateAction from '../actions/RESTful/updateItem';
import destroyItemAction from '../actions/RESTful/destroyItem';
import selectItemAction from '../actions/selection/selectItem';
import selectAnotherAction from '../actions/selection/selectAnotherItem';
import deselectAction from '../actions/selection/deselectItem';
import clearSelectedAction from '../actions/selection/clearSelectedItems';
import clearResourceAction from '../actions/clear/clearResource';
import clearItemAction from '../actions/clear/clearItem';
import clearListAction from '../actions/clear/clearList';
import without from '../utils/list/without';
import ResourcesOnlyActionsDictionary from '../constants/ResourcesOnlyActionsDictionary';
import pluck from '../utils/list/pluck';

/**
 * Dictionary of standard action creators that perform a mix of synchronous and asynchronous changes where
 * updates need to be sent to a remote API to synchronise the local data state with the remote one.
 */
const STANDARD_ACTION_CREATORS = {
  fetchList: fetchListAction.actionCreator,
  fetchItem: fetchItemAction.actionCreator,
  newItem: newAction.actionCreator,
  clearNewItem: clearNewItemAction.actionCreator,
  editNewItem: editNewItemAction.actionCreator,
  createItem: createItemAction.actionCreator,
  editItem: editAction.actionCreator,
  editNewOrExistingItem: editNewOrExistingItemItemAction.actionCreator,
  clearItemEdit: clearItemEditAction.actionCreator,
  updateItem: updateAction.actionCreator,
  destroyItem: destroyItemAction.actionCreator,

  clearItem: clearItemAction.actionCreator,
  clearList: clearListAction.actionCreator,
  clearResource: clearResourceAction.actionCreator,

  selectItem: selectItemAction.actionCreator,
  selectAnotherItem: selectAnotherAction.actionCreator,
  deselectItem: deselectAction.actionCreator,
  clearSelectedItems: clearSelectedAction.actionCreator
};

/**
 * Dictionary of action creators to use when then the localOnly option is set. These effectively cut out
 * requests to a remote RESTful API and instead perform the changes locally and synchronously.
 */
const LOCAL_ONLY_ACTION_CREATORS = {
  ...without(STANDARD_ACTION_CREATORS, Object.keys(RemoteOnlyActionsDictionary)),
  createItem: createItemAction.localActionCreator,
  updateItem: updateAction.localActionCreator,
  destroyItem: destroyItemAction.localActionCreator,
};

/**
 * Dictionary of action creators to use when then the singular option is set. These effectively cut out
 * the actions that don't make sense on a singular resource
 */
const SINGULAR_ACTION_CREATORS = {
  ...without(STANDARD_ACTION_CREATORS, Object.keys(ResourcesOnlyActionsDictionary)),
};

/**
 * @typedef {string} ActionCreatorName The name of a function that dispatches an action
 */

/**
 * @typedef {Object.<string, any>} ActionObject An object resenting an action being dispatched in the
 *          Redux store
 */

/**
 * @callback ActionThunk Performs an asynchronous action and calls dispatch when it is done with a new
 *           ActionObject
 * @param {Function} dispatch The Redux store's dispatch function
 */

/**
 * @typedef {Object} ActionCreatorOptions Options used to configure individual calls of action creators and
 *          override any options specified in GlobalOptions, ResourceOptions or ActionOptions.
 *
 */

/**
 * @typedef {ActionCreatorOptions} RemoteActionCreatorOptions
 *
 * @property {boolean} [force=false] Whether to ignore any outstanding requests with the same URL and make
 *          the request again, anyway
 */

/**
 * @typedef {RemoteActionCreatorOptions} RemoteActionCreatorOptionsWithMetadata
 *
 * @property {Metadata} [metadata] An object of attributes and values that describe the metadata of the
 *           list. It can be used for containing information like page numbers, limits, offsets and
 *           includes for lists and types for items (previews, or the complete set of attributes of
 *           an item).
 */

/**
 * @callback ActionCreatorFunction Function that dispatches an ActionObject or an ActionThunk
 * @returns {ActionObject|ActionThunk}
 */

/**
 * @typedef {Object<ActionCreatorName, ActionCreatorFunction>} ActionCreatorDictionary A dictionary of
 *          ActionCreatorFunctions indexed by their ActionCreatorName
 */


function getActionCreators({ localOnly, singular }) {
  if (localOnly) {
    if (singular) {

      /**
       * If both the localOnly and singular options have been specified, then we need to use only the subset
       * of action creators that make sense for a singular resource, with their localOnly equivalents
       */
      return pluck(LOCAL_ONLY_ACTION_CREATORS, SINGULAR_ACTION_CREATORS);
    }

    /**
     * If only the localOnly option has been specified, we use the reduced set of action creators for managing
     * resources locally.
     */
    return LOCAL_ONLY_ACTION_CREATORS;
  } else if (singular) {

    /**
     * If only the singular option has been used, we use the reduced set of action creators that make sense for
     * a singular resource.
     */
    return SINGULAR_ACTION_CREATORS;
  }

  /**
   * If neither option has been specified, we stick with the default action creators for maintaining resources
   * with a remote API.
   */
  return STANDARD_ACTION_CREATORS;
}

/**
 * Builds a dictionary of ActionCreatorFunctions based in on resource and action options
 * @param {ResourceOptions} resourceOptions Resource options
 * @param {ActionDictionary} actions Dictionary of actions
 * @param {ActionOptionsMap} actionsOptions Options for the action creators
 * @returns {ActionCreatorDictionary} The dictionary of all available ActionCreatorFunctions
 */
function buildActionCreators(resourceOptions, actions, actionsOptions) {
  const { name } = resourceOptions;

  const effectiveActionCreators = getActionCreators(resourceOptions);

  return Object.keys(actionsOptions).reduce((memo, key) => {

    /**
     * We don't export certain action creators when the localOnly option is used (as they don't make sense in
     * a local context).
     *
     * See RemoteOnlyActionsDictionary for a full list of actions that are excluded when the localOnly option is
     * used.
     */
    if ((resourceOptions.localOnly && RemoteOnlyActionsDictionary[key]) ||
          (resourceOptions.singular && ResourcesOnlyActionsDictionary[key])) {
      return memo;
    }

    /**
     * @type {{actionCreator}} actionOptions
     */
    const actionOptions = wrapInObject(actionsOptions[key]);

    const actionCreator = isObject(actionOptions) && actionOptions.actionCreator;

    const standardActionCreator = effectiveActionCreators[key];

    if (actionCreator) {

      memo[key] = actionCreator;

    } else if (standardActionCreator) {
      const actionOptionsMergedWithResourcOptions = resolveOptions(
        resourceOptions,
        actionOptions,
        [
          'url',
          'keyBy',
          'urlOnlyParams',
          'responseAdaptor',
          'requestAdaptor',
          'progress',
          'requestErrorHandler',
          'metadata',
          'localOnly',
          'singular'
        ]
      );

      /**
       * We process request options separately as they should be recursively merged
       */
      const requestOptions = {
          ...(resourceOptions.request || {}),
          ...(actionOptions.request || {})
      };

      const actionConfiguration = {
        action: actions[key],
        name,
        ...actionOptionsMergedWithResourcOptions,
        request: requestOptions
      };

      memo[key] = (arg1, arg2, arg3) => {
        const globalConfiguration = getConfiguration();

        const reloadedOptions = {
          ...globalConfiguration,
          ...actionConfiguration,
          request: { ...globalConfiguration.request, ...(actionConfiguration.request || {}) }
        };

        return standardActionCreator(reloadedOptions, arg1, arg2, arg3);
      };

    } else {
      warn(`'${key}' must match the list of standard action creators (${Object.keys(STANDARD_ACTION_CREATORS).join(', ')}) or define an 'actionCreator' option. Check the options for ${name}`);
    }

    return memo;
  }, {});
}

export default buildActionCreators;
