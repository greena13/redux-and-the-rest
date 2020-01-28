import { SUCCESS } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getItemKey from '../helpers/getItemKey';

function receiveUpdatedResource(options, actionCreatorOptions, values, previousValues) {
  const { transforms, action, params, keyBy } = options;

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([params, values], { keyBy }),
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: SUCCESS, syncedAt: Date.now() }
    }),
    previousValues
  };
}

export default receiveUpdatedResource;
