import { CREATING } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function submitCreateResource(options, temporaryKey, values, collectionKeys) {
  const { transforms, action } = options;

  return {
    type: action,
    status: CREATING,
    temporaryKey, collectionKeys,
    item: applyTransforms(transforms, options, {
      ...ITEM,
      values,
      status: { type: CREATING }
    })
  };
}

export default submitCreateResource;
