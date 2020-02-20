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
   * @returns {InitialStateBuilder} itself to allow for chaining method calls
   */
  setStatusType(statusType) {
    this.status.type = statusType;

    return this;
  }

  /**
   * Sets the projection of the initial state
   * @param {ResourceProjection} projectionType The projection object to set as the initial state
   * @returns {InitialStateBuilder} itself to allow for chaining method calls
   */
  setProjection(projectionType) {
    this.projection.type = projectionType;

    return this;
  }
}

export default InitialStateBuilder;
