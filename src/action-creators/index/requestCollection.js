import { FETCHING } from '../../constants/Statuses';
import { COLLECTION } from '../../constants/DataStructures';

function requestCollection(options, key) {
  const { action } = options;

  return {
    type: action,
    status: FETCHING,
    collection: {
      ...COLLECTION,
      status: { type: FETCHING }
    },
    key,
  };
}

export default requestCollection;
