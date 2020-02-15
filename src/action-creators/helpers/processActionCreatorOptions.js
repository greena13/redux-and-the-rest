/**
 * Extracts the correct values for action controllers' variable arguments
 * @param {Object|string} paramsOrValues The first argument which can either a string or object that is serialized
 *        and used to fill in the dynamic parameters of the resource's URL (params) or the values used by the
 *        action creator.
 * @param {Object} valuesOrActionCreatorOptions The second argument, which can either be the values used by the
 *        action creator, or addition options passed to the action creator when it is called.
 * @param {Object} actionCreatorOptions=undefined The optional additional options passed to the action controller.
 * @returns {{actionCreatorOptions: Object, values: Object, params: Object|string}}
 */
function processActionCreatorOptions(paramsOrValues, valuesOrActionCreatorOptions = undefined, actionCreatorOptions = undefined) {
  if (actionCreatorOptions === undefined) {
    if (valuesOrActionCreatorOptions === undefined) {

      /**
       * Support specifying the values of an action creator as the first and only argument
       */
      return {
        params: {},
        values: paramsOrValues,
        actionCreatorOptions: {}
      };
    } else {

      /**
       * Support specifying the params as the first argument and the values as the second
       */
      return {
        params: paramsOrValues,
        values: valuesOrActionCreatorOptions,
        actionCreatorOptions: {}
      };
    }
  } else {

    /**
     * Support specifying all 3 arguments: params first, values next and finally action creator options
     */
    return {
      params: paramsOrValues,
      values: valuesOrActionCreatorOptions,
      actionCreatorOptions: actionCreatorOptions || {}
    };
  }
}

export default processActionCreatorOptions;
