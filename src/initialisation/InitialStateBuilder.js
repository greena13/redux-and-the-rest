/**
 * Common interface between state builder classes
 */
class InitialStateBuilder {
  constructor(options) {
    this.options = options;

    this.status = {};
    this.projection = {};
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
   * Sets the projection of the initial state
   * @param {ResourceProjection} projection The projection object to set as the initial state
   * @returns {InitialStateBuilder} itself to allow for chaining method calls
   */
  setProjection(projection) {
    this.projection = projection;

    return this;
  }
}

export default InitialStateBuilder;
