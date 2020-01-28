import { FETCHING } from '../../constants/Statuses';
import { COLLECTION } from '../../constants/DataStructures';
import { COMPLETE } from '../../constants/ProjectionTypes';

function requestCollection(options, key) {
  const { action, projection = { type: COMPLETE } } = options;

  return {
    type: action,
    status: FETCHING,
    collection: {
      ...COLLECTION,
      status: { type: FETCHING },
      projection: projection
    },
    key,
  };
}

export default requestCollection;
