/**
 * Standardises association options to convert the basic syntax:
 *  belongs_to: ['users']
 *
 *  to the more expansive:
 *
 *  belongs_to: {
 *    users: {
 *      // ...
 *    }
 *  }
 * @param {Object} options Association options in one of few succinct formats
 * @returns {AssociationOptions} The standardised association options
 */
import dictionaryFrom from './object/dictionaryFrom';

function standardiseAssociationOptions(options) {

  return Array.isArray(options) ? dictionaryFrom(options, {}) : options;
}

export default standardiseAssociationOptions;
