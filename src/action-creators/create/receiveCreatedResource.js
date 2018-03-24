import { SUCCESS } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function receiveCreatedResource(options, temporaryKey, values, collectionKeys) {
  const { action, keyBy, transforms } = options;

  return {
    type: action,
    status: SUCCESS,
    key: values[keyBy],
    temporaryKey, collectionKeys,
    item: applyTransforms(transforms, options, {
      values,
      status: { type: SUCCESS }
    })
  };
}

export default receiveCreatedResource;
