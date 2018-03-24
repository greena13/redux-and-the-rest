import isEmpty from '../../utils/collection/isEmpty';

function applyTransforms(transforms, options, item) {
  if (isEmpty(transforms)) {
    return item;
  } else {
    return transforms.reduce((memo, transform) => transform(options, memo), item);
  }
}

export default applyTransforms;
