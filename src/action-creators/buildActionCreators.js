import warn from '../utils/dev/warn';
import isObject from '../utils/object/isObject';
import wrapInObject from '../utils/object/wrapInObject';
import resolveOptions from './helpers/resolveOptions';
import projectionTransform from './helpers/transforms/projectionTransform';
import { getConfiguration } from '../configuration';
import RemoteOnlyActionsDictionary from '../constants/RemoteOnlyActionsDictionary';
import fetchItemAction from '../actions/RESTful/fetchItem';
import fetchCollectionAction from '../actions/RESTful/fetchCollection';
import newAction from '../actions/RESTful/newItem';
import clearNewItemAction from '../actions/RESTful/clearNewItem';
import editNewItemAction from '../actions/RESTful/editNewItem';
import createItemAction from '../actions/RESTful/createItem';
import editAction from '../actions/RESTful/editItem';
import clearItemEditAction from '../actions/RESTful/clearItemEdit';
import updateAction from '../actions/RESTful/update';
import destroyItemAction from '../actions/RESTful/destroyItem';
import selectAction from '../actions/selection/select';
import selectAnotherAction from '../actions/selection/selectAnother';
import deselectAction from '../actions/selection/deselect';
import clearSelectedAction from '../actions/selection/clearSelected';
import clearResourceAction from '../actions/clear/clearResource';
import clearItemAction from '../actions/clear/clearItem';
import clearCollectionAction from '../actions/clear/clearCollection';
import without from '../utils/collection/without';
import getActionCreatorNameFrom from './helpers/getActionCreatorNameFrom';
import DefaultConfigurationOptions from '../constants/DefaultConfigurationOptions';
import EmptyKey from '../constants/EmptyKey';
import ResourcesOnlyActionsDictionary from '../constants/ResourcesOnlyActionsDictionary';
import pluck from '../utils/collection/pluck';

/**
 * Dictionary of standard action creators that perform a mix of synchronous and asynchronous changes where
 * updates need to be sent to a remote API to synchronise the local data state with the remote one.
 */
const STANDARD_ACTION_CREATORS = {
  fetchCollection: fetchCollectionAction.actionCreator,
  fetchItem: fetchItemAction.actionCreator,
  newItem: newAction.actionCreator,
  clearNewItem: clearNewItemAction.actionCreator,
  editNewItem: editNewItemAction.actionCreator,
  createItem: createItemAction.actionCreator,
  editItem: editAction.actionCreator,
  clearItemEdit: clearItemEditAction.actionCreator,
  update: updateAction.actionCreator,
  destroyItem: destroyItemAction.actionCreator,

  clearItem: clearItemAction.actionCreator,
  clearCollection: clearCollectionAction.actionCreator,
  clearResource: clearResourceAction.actionCreator,

  select: selectAction.actionCreator,
  selectAnother: selectAnotherAction.actionCreator,
  deselect: deselectAction.actionCreator,
  clearSelected: clearSelectedAction.actionCreator
};

/**
 * Dictionary of action creators to use when then the localOnly option is set. These effectively cut out
 * requests to a remote RESTful API and instead perform the changes locally and synchronously.
 */
const LOCAL_ONLY_ACTION_CREATORS = {
  ...without(STANDARD_ACTION_CREATORS, Object.keys(RemoteOnlyActionsDictionary)),
  createItem: createItemAction.localActionCreator,
  update: updateAction.localActionCreator,
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
 * @param {ActionsDictionary} actions Dictionary of actions
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

    const actionCreatorName = getActionCreatorNameFrom(key);

    const actionCreator = isObject(actionOptions) && actionOptions.actionCreator;

    const standardActionCreator = effectiveActionCreators[key];

    if (actionCreator) {

      memo[actionCreatorName] = actionCreator;

    } else if (standardActionCreator) {
      const _options = resolveOptions(
        DefaultConfigurationOptions,
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
          'projection',
          'localOnly',
          'singular'
        ]
      );

      /**
       * We process request options separately as they should be recursively merged
       */
      const requestOptions = {
          ...(DefaultConfigurationOptions.request || {}),
          ...(resourceOptions.request || {}),
          ...(actionOptions.request || {})
      };

      const actionCreatorConfig = {
        action: actions.get(key),
        transforms: [],
        name,
        urlOnlyParams: [],
        ..._options,
        request: requestOptions
      };

      actionCreatorConfig.transforms.push(projectionTransform);

      memo[actionCreatorName] = (arg1, arg2, arg3) => {
        const config = getConfiguration();

        const reloadedOptions = {
          ...config,
          ...actionCreatorConfig,
          request: { ...config.request, ...(actionCreatorConfig.request || {}) }
        };

        if (resourceOptions.singular) {
          return standardActionCreator(reloadedOptions, EmptyKey, arg1, arg2);
        }

        return standardActionCreator(reloadedOptions, arg1, arg2, arg3);
      };

    } else {
      warn(`'${key}' must match the collection of standard action creators (${Object.keys(STANDARD_ACTION_CREATORS).join(', ')}) or define an 'actionCreator' option. Check the options for ${name}`);
    }

    return memo;
  }, {});
}

export default buildActionCreators;
