import { SUCCESS } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getItemKey from '../helpers/getItemKey';

function receiveCreatedResource(options, actionCreatorOptions, values) {
  const { action, keyBy, transforms, key, params, collectionOperations } = options;

  return {
    type: action,
    status: SUCCESS,
    key: getItemKey([params, values], { keyBy }),
    temporaryKey: key,
    collectionOperations,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      values,
      status: { type: SUCCESS, syncedAt: Date.now() }
    })
  };
}

export default receiveCreatedResource;
