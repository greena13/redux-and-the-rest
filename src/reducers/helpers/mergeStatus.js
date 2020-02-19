/**
 * Merges two status objects, persisting only a whitelist of attributes
 * @param {Object} oldStatus The status object to persist a whitelist of attributes from, allowing them to
 *        be overridden by the newStatus.
 * @param {Object} newStatus The new status object.
 * @param {Object} options Options hash
 * @param {Array<String>} options.onlyPersist A list of attributes to persist from the old status if they are defined
 * @return {Object} The new merged status object
 */
import resolveOptions from '../../action-creators/helpers/resolveOptions';

function mergeStatus(oldStatus, newStatus, options = {}) {
  if (options.onlyPersist) {
    return resolveOptions(oldStatus, newStatus, [...options.onlyPersist, ...Object.keys(newStatus)]);
  } else {
    return {
      ...oldStatus,
      ...newStatus
    };
  }
}

export default mergeStatus;
