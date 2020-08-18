/**
 * Extracts the correct values for action controllers' variable arguments
 * @param {Object|string} paramsOrValues The first argument which can either a string or object that is serialized
 *        and used to fill in the dynamic parameters of the resource's URL (params) or the values used by the
 *        action creator.
 * @param {Object} [valuesOrActionCreatorOptions=undefined] The second argument, which can either be the values used by the
 *        action creator, or addition options passed to the action creator when it is called.
 * @param {Object} [actionCreatorOptions=undefined] The optional additional options passed to the action controller.
 *
 * * If only one argument is provided, it is interpreted as the values to use for the action creator.
 * * If two arguments are provided, the first is interpreted as the params and the second as the values.
 * * If three arguments are provided, they're interpreted as params, values and options, respectively.
 *
 * This means in order to define action creator options, you must specify both params and values (if the action
 * creator accepts a values argument).
 *
 * @returns {{actionCreatorOptions: Object, values: Object, params: (Object|string)}} Action creator options
 */
import isUndefined from '../../utils/isUndefined';

function processActionCreatorOptions(paramsOrValues, valuesOrActionCreatorOptions = undefined, actionCreatorOptions = undefined) {
  if (isUndefined(actionCreatorOptions)) {
    if (isUndefined(valuesOrActionCreatorOptions)) {

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
