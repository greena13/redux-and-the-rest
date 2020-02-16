import { DOWN, UP } from '../../constants/ProgressDirections';
import { PROGRESS, SUCCESS } from '../../constants/Statuses';

function progressReducer(resources, action, attr = 'items') {
  const { temporaryKey, key } = action;

  const _key = temporaryKey || key;

  const progressAttributes = function(){
    if (action.status === PROGRESS) {
      const { percent, total, loaded, lengthComputable, direction } = action;

      return {
        percent, total, loaded, lengthComputable, direction
      };
    } else if (action.status === SUCCESS) {
      const { total, lengthComputable } = resources[attr][_key].status.progressDown;

      return {
        percent: 100, total, loaded: total, lengthComputable, direction: DOWN
      };
    } else {
      return null;
    }
  }();

  if (progressAttributes) {
    return {
      ...resources,
      [attr]: {
        ...resources[attr],
        [_key]: updateProgress(resources[attr][_key], progressAttributes)
      }
    };
  } else {
    return resources;
  }
}

function updateProgress(resource, { percent, total, loaded, lengthComputable, direction }) {
  const progressAttributes = function(){
    if (direction === UP) {
      return {
        progressUp: {
          total, loaded, percent, lengthComputable
        }
      };
    } else {
      return {
        progressDown: {
          total, loaded, percent, lengthComputable
        }
      };
    }
  }();

  return {
    ...resource,
    status: {
      progressUp: {
        percent: 0,
        loaded: 0,
        total: undefined,
        lengthComputable: undefined,
      },
      progressDown: {
        percent: 0,
        loaded: 0,
        total: undefined,
        lengthComputable: undefined,
      },
      ...resource.status,
      ...progressAttributes,
    }
  };
}

export default progressReducer;
