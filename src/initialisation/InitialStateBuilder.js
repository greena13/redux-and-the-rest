/**
 * Common interface between state builder classes
 */
class InitialStateBuilder {
  constructor(options) {
    this.options = options;

    this.status = {};
    this.metadata = {};
  }

  /**
   * Sets the status of the initial state
   * @param {ResourceStatus} statusType The status type to set as the initial state
   * @returns {InitialStateBuilder} Itself, to allow for chaining method calls
   */
  setStatusType(statusType) {
    this.status.type = statusType;

    return this;
  }

  /**
   * Sets the date the data was synced at
   * @param {number} date The date the data was last synced
   * @returns {InitialStateBuilder} itself to allow for chaining method calls
   */
  setSyncedAt(date) {
    this.status.syncedAt = date;

    return this;
  }

  /**
   * Sets the metadata of the initial state
   * @param {ResourceMetadata} metadata The metadata object to set as the initial state
   * @returns {InitialStateBuilder} itself to allow for chaining method calls
   */
  setMetadata(metadata) {
    this.metadata = metadata;

    return this;
  }
}

export default InitialStateBuilder;
