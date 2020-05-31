import assertInDevMode from './assertInDevMode';
import warn from './dev/warn';
import standardiseAssociationOptions from './standardiseAssociationOptions';
import addAssociationReducer from '../reducers/helpers/addAsssociationReducer';
import toPlural from './string/toPlural';

let registry = null;

class ResourceRegistry {
  static getRegistry(){
    if (!registry) {
      registry = new ResourceRegistry();
    }

    return registry;
  }

  constructor() {
    this.clear();
  }

  addResource(options, definition, reducersDictionary) {
    const { name } = options;

    assertInDevMode(() => {
      if (this.getResource(name)) {
        warn(`Overriding resource with name '${name}', which has already been defined. This can result in unpredictable behaviour.`);
      }
    });

    /**
     * Save the resource definition in the registry so that we can retrieve it, if necessary, to hook up associated
     * resources (by adding more reducers that respond to the associated resource's actions)
     */
    this.setResource(name, { options, definition, reducersDictionary });

    ['belongsTo', 'hasAndBelongsToMany'].forEach((associationType) => {
      const _associationOptions = options[associationType];

      if (_associationOptions) {
        const associationOptions = standardiseAssociationOptions(_associationOptions);

        Object.keys(associationOptions).forEach((associatedResourceName) => {
          const resource = this.getResource(associatedResourceName);

          if (resource) {

            /**
             * The associated resource has already been defined, so we can hook up the association immediately
             */

            const { definition: { actions: associatedResourcesActions } } = resource;

            /**
             * Add extra reducers for actions of the associated resource, so this one can respond with the
             * associated resource is updated
             */
            addAssociationReducer(

              /**
               * This resource's attributes
               */
              reducersDictionary,
              name,

              associationType,

              /**
               * The associated resource's attributes
               */
              associatedResourceName,
              associatedResourcesActions,

              associationOptions[associatedResourceName]
            );
          } else {

            /**
             * Associated resource is not yet defined, so we store the options required to correctly associate
             * it when it is
             */

            if (!this.getAssociation(associatedResourceName)) {
              this.setAssociation(associatedResourceName, []);
            }

            this.getAssociation(associatedResourceName).push({ resourceName: name, associationType });
          }
        });
      }
    });

    /**
     * Now that we have defined any associations with any resources that are already defined (or queued them
     * for when those resources are defined), we check if any other resources have been waiting for this one
     * to be defined, to be associated with it.
     */

    const pendingAssociations = this.getAssociation(name);

    if (pendingAssociations) {
      pendingAssociations.forEach(({ resourceName, associationType }) => {
        const {
          options: {
            name: associatedResourceName,
            [associationType]: { [name]: associationOptions = {} },
          },
          reducersDictionary: associatedResourceReducersDict
        } = this.getResource(resourceName);

        addAssociationReducer(

          /**
           * This resource's attributes
           */
          associatedResourceReducersDict,
          associatedResourceName,

          associationType,

          /**
           * The associated resource's attributes
           */
          options.name,
          definition.actions,

          associationOptions
        );
      });

      Reflect.deleteProperty(this.associations, name);
    }
  }

  getResource(key) {
    return this.getKey(this.resources, key);
  }

  getAssociation(key) {
    return this.getKey(this.associations, key);
  }

  setResource(key, value) {
    this.setKey(this.resources, key, value);
  }

  setAssociation(key, value) {
    this.setKey(this.associations, key, value);
  }

  getKey(target, key) {
    return target[toPlural(key)];
  }

  setKey(target, key, value) {
    target[toPlural(key)] = value;
  }

  clear() {
    this.resources = {};
    this.associations = {};
  }
}

export default ResourceRegistry;
