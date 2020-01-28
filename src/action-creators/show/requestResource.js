import { ITEM } from '../../constants/DataStructures';
import { FETCHING } from '../../constants/Statuses';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import { COMPLETE } from '../../constants/ProjectionTypes';

function requestResource(options, actionCreatorOptions) {
  const { transforms, action, key, projection = { type: COMPLETE } } = options;

  return {
    type: action,
    status: FETCHING,
    key,
    item: applyTransforms(transforms, options, actionCreatorOptions, {
      ...ITEM,
      values: { },
      status: { type: FETCHING },
      projection
    })
  };
}

export default requestResource;
