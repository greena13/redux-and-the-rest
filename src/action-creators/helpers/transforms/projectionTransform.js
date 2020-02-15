import { COMPLETE } from '../../../constants/ProjectionTypes';

function projectionTransform(options, actionCreatorOptions, item) {
  const projection = function(){
    if (actionCreatorOptions.projection) {
      return actionCreatorOptions.projection;
    } else if (!item.projection || !item.projection.type) {
      if (options.projection) {
        return options.projection;
      } else {
        return { type: COMPLETE };
      }
    } else {
      return item.projection;
    }
  }();

  return {
    ...item,
    projection
  };
}

export default projectionTransform;
