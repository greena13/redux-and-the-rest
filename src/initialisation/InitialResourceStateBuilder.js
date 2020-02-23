import InitialCollectionStateBuilder from './InitialCollectionStateBuilder';
import EmptyKey from '../constants/EmptyKey';
import InitialStateBuilder from './InitialStateBuilder';
import isEmpty from '../utils/collection/isEmpty';
import { RESOURCES } from '..';
import extractVariableArguments from '../utils/extractVariableArguments';
import getItemKey from '../action-creators/helpers/getItemKey';
import getCollectionKey from '../action-creators/helpers/getCollectionKey';
import InitialItemStateBuilder from './InitialItemStateBuilder';

/**
 * Object for building and then returning an initial state that can be passed to a Redux store and work
 * with the reducers returned by the resources() function
 */
class InitialResourceStateBuilder extends InitialStateBuilder {
  constructor(options, items = []) {
    super(options);

    this.collections = {};
    this.items = {};

    if (!isEmpty(items)) {
      items.forEach((item) => this.addItem(item));
    }
  }

  /**
   * Adds a new collection to the initial state builder
   * @param {Object | Object[]} itemsOrParams Either the params to use to index the collection or the list of items that
   *        make up the collection. If no params are specified, the default unscoped collection is used.
   * @param {Object} [optionalItems=[]] The list of items in the collection, if they were not specified as
   *        the first argument
   * @returns {InitialCollectionStateBuilder} A new initial state builder scoped to the new collection
   */
  addCollection(itemsOrParams, optionalItems) {
    const { items, params = EmptyKey } = extractVariableArguments(['params', 'items'], [itemsOrParams, optionalItems]);

    const collectionStateBuilder = new InitialCollectionStateBuilder(this.options, items);
    const key = getCollectionKey(params);

    this.collections[key] = collectionStateBuilder;

    return collectionStateBuilder;
  }

  /**
   * Adds a new item to the initial state builder
   * @param {Object} paramsOrValues Either the values of a new item to add to the initial state, outside of any
   *        collection, or the params of the item to use to index it.
   * @param {Object} [optionalValues={}] The values of the item, if the first argument was used to specify params
   * @returns {InitialItemStateBuilder} A new initial state builder scoped to the new item
   */
  addItem(paramsOrValues, optionalValues) {
    const { values, params = {} } = extractVariableArguments(['params', 'values'], [paramsOrValues, optionalValues]);

    const key = getItemKey([params, values], { keyBy: this.options.keyBy });

    const itemStateBuilder = new InitialItemStateBuilder(this.options, values);

    this.items[key] = itemStateBuilder;

    return itemStateBuilder;
  }

  /**
   * Generates the initial state the builder has been configured for, in the format suitable to pass to
   * the Redux store.
   * @returns {ResourcesReduxState}
   */
  build() {
    const itemsOutsideOfCollections = Object.keys(this.items).reduce((memo, key) => {
      const item = this.items[key];

      memo[key] = item.build({ status: this.status, projection: this.projection });

      return memo;
    }, {});

    const itemsFromCollections = Object.values(this.collections).reduce((memo, collection) => {
      return {
        ...memo,
        ...collection.buildItems({ status: this.status, projection: this.projection })
      }
    }, {});

    return {
      /**
       * Inherit the generic properties of a resource object that should not be available for
       * customisation when specifying initial state
       */
      ...RESOURCES,

      /**
       * We merge the dictionary of items that are in collections with those that are not
       * @type {Object<ResourceItemId, ResourceItem>}
       */
      items: { ...itemsOutsideOfCollections, ...itemsFromCollections },

      /**
       * We build the dictionary of collections
       */
      collections:  Object.keys(this.collections).reduce((memo, key) => {
        const collection = this.collections[key];
        memo[key] = collection.build({ status: this.status, projection: this.projection });

        return memo;
      }, {})
    }
  }
}

export default InitialResourceStateBuilder;
