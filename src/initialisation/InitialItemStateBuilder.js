import InitialStateBuilder from './InitialStateBuilder';
import { ITEM } from '../constants/DataStructures';
import { COMPLETE } from '../constants/MetadataTypes';
import { SUCCESS } from '../constants/Statuses';

/**
 * Object for building and then returning an initial resource item state that can be passed to a Redux store
 * and work with the reducers returned by the resources() function
 */
class InitialItemStateBuilder extends InitialStateBuilder {
  constructor(options, values) {
    super(options);

    this.values = values;
  }

  /**
   * Generates the initial item state the builder has been configured for, in the format suitable to pass to
   * the Redux store.
   * @param {Object} options An object of configuration options
   * @param {ResourceStatus} options.status The status to use for the item if it hasn't set its own.
   * @param {ResourceMetadata} options.metadata The metadata for the item if it hasn't set its own.
   * @return {ResourcesItem} The initial item state
   */
  build({ status = {}, metadata = {} }) {
    return {
      ...ITEM,
      values: this.values,
      status: { type: SUCCESS, ...status, ...this.status },
      metadata: { type: COMPLETE, ...metadata, ...this.metadata }
    };
  }
}

export default InitialItemStateBuilder;
