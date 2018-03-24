import { SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';

function receiveCollection(options, key, collection) {
  const { transforms, keyBy, action } = options;

  const items = collection.reduce((memo, values) => {
    memo[values[keyBy]] = applyTransforms(transforms, options, {
      ...ITEM,
      values,
      status: { type: SUCCESS },
    });

    return memo;
  }, {});

  return {
    type: action,
    status: SUCCESS,
    items,
    key,
    collection: {
      positions: collection.map((item) => item[keyBy]),
      status: { type: SUCCESS },
    }
  };

}

export default receiveCollection;
