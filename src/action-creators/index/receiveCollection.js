import { SUCCESS } from '../../constants/Statuses';
import { ITEM } from '../../constants/DataStructures';
import applyTransforms from '../../reducers/helpers/applyTransforms';
import getItemKey from '../helpers/getItemKey';

function receiveCollection(options, collection) {
  const { transforms, key, keyBy, action, params } = options;

  const positions = [];

  const syncedAt = Date.now();

  const items = collection.reduce((memo, values) => {
    const itemKey = getItemKey([ params, values ], { keyBy });
    positions.push(itemKey);

    memo[itemKey] = applyTransforms(transforms, options, {
      ...ITEM,
      values,
      status: { type: SUCCESS, syncedAt },
    });

    return memo;
  }, {});

  return {
    type: action,
    status: SUCCESS,
    items,
    key,
    collection: {
      positions,
      status: { type: SUCCESS, syncedAt },
    }
  };

}

export default receiveCollection;
