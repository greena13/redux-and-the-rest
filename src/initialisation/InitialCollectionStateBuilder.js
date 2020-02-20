import InitialStateBuilder from './InitialStateBuilder';
import getItemKey from '../action-creators/helpers/getItemKey';
import InitialItemStateBuilder from './InitialItemStateBuilder';
import { COLLECTION } from '../constants/DataStructures';
import { COMPLETE } from '../constants/ProjectionTypes';
import { SUCCESS } from '../constants/Statuses';
import extractVariableArguments from '../utils/extractVariableArguments';

/**
 * Object for building and then returning an initial resource collection state that can be passed to a Redux store
 * and work with the reducers returned by the resources() function
 */
class InitialCollectionStateBuilder extends InitialStateBuilder {
  constructor(options, items = []) {
    super(options);

    this.items = {};
    this.positions = [];

    items.forEach((item) => this.addItem(item));
  }

  /**
   * Adds a new item to the collection's initial state builder
   * @param {Object} paramsOrValues Either the values of a new item to add to the initial state, outside of any
   *        collection, or the params of the item to use to index it.
   * @param {Object} [optionalItems={}] The values of the item, if the first argument was used to specify params
   * @returns {InitialItemStateBuilder} A new initial state builder scoped to the new item
   */
  addItem(paramsOrValues, optionalItems) {
    const { values, params = {} } = extractVariableArguments(['params', 'values'], [paramsOrValues, optionalItems]);

    const key = getItemKey([params, values], { keyBy: this.options.keyBy });

    const itemStateBuilder = new InitialItemStateBuilder(this.options, values);
    this.items[key] = itemStateBuilder;
    this.positions.push(key);

    return itemStateBuilder;
  }

  /**
   * Generates the initial collection state the builder has been configured for, in the format suitable to
   * pass to the Redux store.
   * @param {Object} options Options hash
   * @param {ResourceStatus} options.status The status to use for the collection and all of its items if
   *        the collection hasn't set its own.
   * @param {ResourceProjection} options.projection The projection to use for the collection and all of its
   *        items if the collection hasn't set its own.
   * @returns {ResourceCollection}
   */
  build({ status = {}, projection = {} }) {
    return {
      ...COLLECTION,
      positions: this.positions,
      status: { type: SUCCESS, ...status, ...this.status },
      projection: { type: COMPLETE, ...projection, ...this.projection }
    };
  }

  /**
   * Generates a map of items indexed by their correct key
   * @param {Object} options Options hash
   * @param {ResourceStatus} options.status The status to use for the items if the collection or item hasn't
   *        set its own.
   * @param {ResourceProjection} options.projection The projection for the items if the collection or item
   *        hasn't set its own.
   */
  buildItems({ status = {}, projection }) {
    return Object.keys(this.items).reduce((memo, key) => {
      const item = this.items[key];

      return {
        ...memo,
        [key]: item.build({
          status: { ...status, ...this.status },
          projection: { type: COMPLETE, ...projection, ...this.projection }
        })
      };
    }, {});
  }
}

export default InitialCollectionStateBuilder;
