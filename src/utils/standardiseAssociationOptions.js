

/**
 * Standardises association options to convert the basic syntax:
 *  belongs_to: {
 *    users: usersResource
 *  }
 *
 *  is implicitly converted the the more expansive:
 *
 *  belongs_to: {
 *    users: {
 *      resource: usersResource
 *    }
 *  }
 *
 *  @return AssociationOptions
 */
function standardiseAssociationOptions(options) {
  if (options.__isResource) {
    return { resource: options };
  } else {
    return options;
  }
}

export default standardiseAssociationOptions;
