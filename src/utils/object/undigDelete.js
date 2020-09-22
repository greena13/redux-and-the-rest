import hasKey from './hasKey';
import dig from './dig';
import isEmpty from '../list/isEmpty';

function undigDelete(target, keys) {
  const lastKeyPosition = keys.length - 1;
  const lastKeyParent = dig(target, keys.slice(0, lastKeyPosition));

  const lastKey = keys[lastKeyPosition];

  if (hasKey(lastKeyParent, lastKey)) {
    Reflect.deleteProperty(lastKeyParent, lastKey);
  }

  const penultimateKeyPosition = keys.length - 2;

  for(let index = penultimateKeyPosition; index > 0; index--) {
    const parentValue = dig(target, keys.slice(0, index));

    if (isEmpty(parentValue)) {
      const grandParentValue = dig(target, keys.slice(0, index - 1));

      Reflect.deleteProperty(grandParentValue, keys[index]);
    }

  }
}

export default undigDelete;
