import isEmpty from '../../utils/list/isEmpty';

function applyTransforms(transforms, options, actionCreatorOptions, item) {
  if (isEmpty(transforms)) {
    return item;
  } else {
    return transforms.reduce((memo, transform) => transform(options, actionCreatorOptions, memo), item);
  }
}

export default applyTransforms;
