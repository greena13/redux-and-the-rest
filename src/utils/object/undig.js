import hasKey from './hasKey';

function undig(target, keys, value) {
  const lastKeyPosition = keys.length - 1;

  let _target = target;

  for(let index = 0; index < lastKeyPosition; index++) {
    const nextKey = keys[index];

    if (!hasKey(_target, nextKey)) {
      _target[nextKey] = {};
    }

    _target = _target[nextKey];
  }

  const lastKey = keys[lastKeyPosition];
  _target[lastKey] = value;

  return target;
}

export default undig;
