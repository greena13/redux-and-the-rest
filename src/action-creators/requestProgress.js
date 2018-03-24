import { PROGRESS } from '../constants/Statuses';

function requestProgress(options, key, { direction, loaded, total, lengthComputable }) {
  const { action } = options;

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
