import { CREATING } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function submitCreateResource(options, temporaryKey, values, collectionOperations) {
  const { transforms, action } = options;

  return {
    type: action,
    status: CREATING,
    temporaryKey, collectionOperations,
    item: applyTransforms(transforms, options, {
      ...ITEM,
      values,
      status: { type: CREATING }
    })
  };
}

export default submitCreateResource;
