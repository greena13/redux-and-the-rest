import isUndefined from '../isUndefined';

function dig(target, keys) {
  let _result = target;

  for(let index = 0; index < keys.length && !isUndefined(_result); index++) {
    _result = _result[keys[index]];
  }

  return _result;
}

export default dig;
