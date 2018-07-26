import { PROGRESS } from '../constants/Statuses';

function requestProgress(options, { direction, loaded, total, lengthComputable }) {
  const { action, key } = options;

  const percent = function(){
    if (lengthComputable) {
      if (total) {
        return loaded / total * 100;
      } else {
        return 100;
      }
    } else {
      return -1;
    }
  }();

  return {
    type: action,
    status: PROGRESS, key,
    loaded, total, direction,
    lengthComputable,
    percent
  };
}

export default requestProgress;
