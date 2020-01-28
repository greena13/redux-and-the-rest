import { CREATING } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function submitCreateResource(options, actionCreatorOptions, values, collectionOperations) {
  const { transforms, action, key } = options;

  return {
    type: action,
    status: CREATING,
    temporaryKey: key, collectionOperations,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values,
      status: { type: CREATING }
    })
  };
}

export default submitCreateResource;
