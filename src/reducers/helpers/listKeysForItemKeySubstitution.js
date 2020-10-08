import keysExplicitlyReferencedByListOperations from './keysExplicitlyReferencedByListOperations';
import { getConfiguration } from '../../configuration';
import contains from '../../utils/list/contains';

/**
 * Processes a hash of ListOperations and returns the keys of the lists that it matches
 * @param {ListOperations} listOperations Hash of list operations to analyse
 * @param {Object} lists Collection of existing lists
 * @returns {string[]} Collection of list keys matching the list operations
 */
function listKeysForItemKeySubstitution(listOperations, lists) {
  const keysExplicitlyReferenced = keysExplicitlyReferencedByListOperations(listOperations);

  if (contains(keysExplicitlyReferenced, getConfiguration().listWildcard)) {

    /**
     * If one of the list operations contained a wildcard, then we need to search all the lists
     */
    return Object.keys(lists);
  }

  /**
   * If no wildcard was used, we just return the keys of the lists that were explicitly referenced
   */
  return keysExplicitlyReferenced;
}

export default listKeysForItemKeySubstitution;
