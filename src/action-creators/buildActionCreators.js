import warn from '../utils/dev/warn';
import isObject from '../utils/object/isObject';
import wrapInObject from '../utils/object/wrapInObject';
import resolveOptions from './helpers/resolveOptions';
import projectionTransform from './helpers/transforms/projectionTransform';
import { getConfiguration } from '../configuration';
import RemoteOnlyActionsDictionary from '../constants/RemoteOnlyActionsDictionary';
import indexAction from '../actions/RESTful/index';
import showAction from '../actions/RESTful/show';
import newAction from '../actions/RESTful/new';
import clearNewAction from '../actions/RESTful/clearNew';
import editNewAction from '../actions/RESTful/editNew';
import createAction from '../actions/RESTful/create';
import editAction from '../actions/RESTful/edit';
import clearEditAction from '../actions/RESTful/clearEdit';
import updateAction from '../actions/RESTful/update';
import destroyAction from '../actions/RESTful/destroy';
import selectAction from '../actions/selection/select';
import selectAnotherAction from '../actions/selection/selectAnother';
import deselectAction from '../actions/selection/deselect';
import clearSelectedAction from '../actions/selection/clearSelected';
import without from '../utils/collection/without';
import getActionCreatorNameFrom from './helpers/getActionCreatorNameFrom';
import DefaultConfigurationOptions from '../constants/DefaultConfigurationOptions';

/**
 * Dictionary of standard action creators that perform a mix of synchronous and asynchronous changes where
 * updates need to be sent to a remote API to synchronise the local data state with the remote one.
 */
const STANDARD_ACTION_CREATORS = {
  index: indexAction.actionCreator,
  show: showAction.actionCreator,
  new: newAction.actionCreator,
  clearNew: clearNewAction.actionCreator,
  editNew: editNewAction.actionCreator,
  create: createAction.actionCreator,
  edit: editAction.actionCreator,
  clearEdit: clearEditAction.actionCreator,
  update: updateAction.actionCreator,
  destroy: destroyAction.actionCreator,

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
  create: createAction.localActionCreator,
  update: updateAction.localActionCreator,
  destroy: destroyAction.localActionCreator,
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

/**
 * Builds a dictionary of ActionCreatorFunctions based in on resource and action options
 * @param {ResourceOptions} resourceOptions Resource options
 * @param {ActionsDictionary} actions Dictionary of actions
 * @param {ActionOptionsMap} actionsOptions Options for the action creators
 * @returns {ActionCreatorDictionary} The dictionary of all available ActionCreatorFunctions
 */
function buildActionCreators(resourceOptions, actions, actionsOptions) {
  const { name } = resourceOptions;

  const effectiveActionCreators = resourceOptions.localOnly ? LOCAL_ONLY_ACTION_CREATORS : STANDARD_ACTION_CREATORS;

  return Object.keys(actionsOptions).reduce((memo, key) => {

    /**
     * We don't export certain action creators when the localOnly option is used (as they don't make sense in
     * a local context).
     *
     * See RemoteOnlyActionsDictionary for a full list of actions that are excluded when the localOnly option is
     * used.
     */
    if (resourceOptions.localOnly && RemoteOnlyActionsDictionary[key]) {
      return memo;
    }
    const actionName = actions.get(key);

    /**
     * @type {{actionCreator}} actionOptions
     */
    const actionOptions = wrapInObject(actionsOptions[key]);

    const actionCreatorName = getActionCreatorNameFrom(actionName);

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
          'localOnly'
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

        return standardActionCreator(reloadedOptions, arg1, arg2, arg3);
      };

    } else {
      warn(`'${key}' must match the collection of standard action creators (${Object.keys(STANDARD_ACTION_CREATORS).join(', ')}) or define an 'actionCreator' option. Check the options for ${name}`);
    }

    return memo;
  }, {});
}

export default buildActionCreators;
