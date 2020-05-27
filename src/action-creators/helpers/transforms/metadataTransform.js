import { COMPLETE } from '../../../constants/MetadataTypes';

function metadataTransform(options, actionCreatorOptions, item) {
  const metadata = function(){
    if (actionCreatorOptions.metadata) {
      return actionCreatorOptions.metadata;
    } else if (!item.metadata || !item.metadata.type) {
      if (options.metadata) {
        return options.metadata;
      } else {
        return { type: COMPLETE };
      }
    } else {
      return item.metadata;
    }
  }();

  return {
    ...item,
    metadata
  };
}

export default metadataTransform;
