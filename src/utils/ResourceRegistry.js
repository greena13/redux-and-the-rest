import assertInDevMode from './assertInDevMode';
import warn from './dev/warn';
import hasKey from './object/hasKey';

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

  addResource(name, resource) {
    assertInDevMode(() => {
      if (hasKey(this.resources, name)) {
        warn(`Overriding resource with name '${name}', which has already been defined. This can result in unpredictable behaviour.`);
      }
    });

    this.resources[name] = resource;
  }

  clear() {
    this.resources = {};
  }
}

export default ResourceRegistry;
