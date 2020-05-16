import { resources } from './index';

/**
 * Defines a new singular resource, returning the actions, action creators, reducers and helpers to manage it
 * @param {ResourceOptions} resourceOptions Hash of options that configure how the resource is defined and
 *        behaves.
 * @param {ActionOptionsMap|string[]} actionOptions Hash of actions
 * @returns {SingularResourceDefinition} The resources definition
 */
function resource(resourceOptions, actionOptions = {}) {
  // noinspection JSCheckFunctionSignatures
  return resources({ ...resourceOptions, singular: true }, actionOptions);
}

export default resource;
