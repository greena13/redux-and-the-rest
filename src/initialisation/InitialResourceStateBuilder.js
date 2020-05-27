import InitialListStateBuilder from './InitialListStateBuilder';
import EmptyKey from '../constants/EmptyKey';
import InitialStateBuilder from './InitialStateBuilder';
import isEmpty from '../utils/list/isEmpty';
import { RESOURCES } from '../constants/DataStructures';
import extractVariableArguments from '../utils/extractVariableArguments';
import getItemKey from '../action-creators/helpers/getItemKey';
import getListKey from '../action-creators/helpers/getListKey';
import InitialItemStateBuilder from './InitialItemStateBuilder';

/**
 * Object for building and then returning an initial state that can be passed to a Redux store and work
 * with the reducers returned by the resources() function
 */
class InitialResourceStateBuilder extends InitialStateBuilder {
  constructor(options, items = []) {
    super(options);

    this.lists = {};
    this.items = {};

    if (!isEmpty(items)) {
      this.addList(items);
    }
  }

  /**
   * Adds a new list to the initial state builder
   * @param {Object | Object[]} itemsOrParams Either the params to use to index the list or the list of items that
   *        make up the list. If no params are specified, the default unscoped list is used.
   * @param {Object} [optionalItems=[]] The list of items in the list, if they were not specified as
   *        the first argument
   * @returns {InitialListStateBuilder} A new initial state builder scoped to the new list
   */
  addList(itemsOrParams, optionalItems) {
    const { items, params = EmptyKey } = extractVariableArguments(['params', 'items'], [itemsOrParams, optionalItems]);

    const listStateBuilder = new InitialListStateBuilder(this.options, items);
    const key = getListKey(params);

    this.lists[key] = listStateBuilder;

    return listStateBuilder;
  }

  /**
   * Adds a new item to the initial state builder
   * @param {Object} paramsOrValues Either the values of a new item to add to the initial state, outside of any
   *        list, or the params of the item to use to index it.
   * @param {Object} [optionalValues={}] The values of the item, if the first argument was used to specify params
   * @returns {InitialItemStateBuilder} A new initial state builder scoped to the new item
   */
  addItem(paramsOrValues, optionalValues) {
    const { values, params = {} } = extractVariableArguments(['params', 'values'], [paramsOrValues, optionalValues]);

    const key = getItemKey([params, values], { keyBy: this.options.keyBy, singular: this.options.singular });

    const itemStateBuilder = new InitialItemStateBuilder(this.options, values);

    this.items[key] = itemStateBuilder;

    return itemStateBuilder;
  }

  /**
   * Generates the initial state the builder has been configured for, in the format suitable to pass to
   * the Redux store.
   * @returns {ResourcesReduxState} The resources' initial state
   */
  build() {
    const itemsOutsideOfLists = Object.keys(this.items).reduce((memo, key) => {
      const item = this.items[key];

      memo[key] = item.build({ status: this.status, metadata: this.metadata });

      return memo;
    }, {});

    const itemsFromLists = Object.values(this.lists).reduce((memo, list) => ({
        ...memo,
        ...list.buildItems({ status: this.status, metadata: this.metadata })
      }), {});

    return {

      /**
       * Inherit the generic properties of a resource object that should not be available for
       * customisation when specifying initial state
       */
      ...RESOURCES,

      /**
       * We merge the dictionary of items that are in lists with those that are not
       * @type {Object<ResourceItemId, ResourcesItem>}
       */
      items: { ...itemsOutsideOfLists, ...itemsFromLists },

      /**
       * We build the dictionary of lists
       */
      lists: Object.keys(this.lists).reduce((memo, key) => {
        const list = this.lists[key];
        memo[key] = list.build({ status: this.status, metadata: this.metadata });

        return memo;
      }, {})
    };
  }
}

export default InitialResourceStateBuilder;
