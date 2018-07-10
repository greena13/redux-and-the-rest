import { SUCCESS } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function receiveCreatedResource(options, temporaryKey, values) {
  const { action, keyBy, transforms, collectionOperations } = options;

  return {
    type: action,
    status: SUCCESS,
    key: values[keyBy],
    temporaryKey,
    collectionOperations,
    item: applyTransforms(transforms, options, {
      values,
      status: { type: SUCCESS }
    })
  };
}

export default receiveCreatedResource;
