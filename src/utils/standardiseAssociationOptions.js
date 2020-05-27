/**
 * Standardises association options to convert the basic syntax:
 *  belongs_to: {
 *    users: usersResource
 *  }
 *
 *  to the more expansive:
 *
 *  belongs_to: {
 *    users: {
 *      resource: usersResource
 *    }
 *  }
 * @param {Object} options Association options in one of few succinct formats
 * @returns {AssociationOptions} The standardised association options
 */
function standardiseAssociationOptions(options) {
  if (options.__isResourcesDefinition) {
    return options;
  }

  const { resource, ..._options } = options;

  return { ...resource, ..._options };
}

export default standardiseAssociationOptions;
