import toPlural from '../../utils/string/toPlural';
import toSingular from '../../utils/string/toSingular';
import replace from '../../utils/list/replace';
import assertInDevMode from '../../utils/assertInDevMode';
import arrayFrom from '../../utils/array/arrayFrom';
import { CREATING, SUCCESS } from '../../constants/Statuses';
import valuesAdded from '../../utils/array/valuesAdded';
import valuesRemoved from '../../utils/array/valuesRemoved';
import without from '../../utils/list/without';
import warn from '../../utils/dev/warn';
import removeItemsFromResources from './removeItemsFromResources';
import contains from '../../utils/list/contains';
import serializeKey from '../../public-helpers/serializeKey';
import isEmpty from '../../utils/list/isEmpty';

function addCreatedHasManyAssociation(resources, { temporaryKey, key, status, item: associationItem }, { relationType, foreignKeyName, keyName }) {
  const associationValues = associationItem.values;

  return {
    ...resources,
    items: {
      ...resources.items,
      ...(arrayFrom(associationValues[foreignKeyName] || associationValues[toPlural(foreignKeyName)]).reduce((memo, itemKey) => {

        const item = resources.items[itemKey];

        const newKeyValue = function(){
          const currentKeyValue = item.values[keyName];

          if (relationType === 'hasAndBelongsToMany') {
            if (status === CREATING) {
              return [
                ...(currentKeyValue || []),
                temporaryKey
              ];
            } else if (status === SUCCESS) {
              return replace(currentKeyValue, temporaryKey, key);
            }
          } else {
            return status === CREATING ? temporaryKey : key;
          }
        }();

        memo[itemKey] = {
          ...item,
          values: {
            ...item.values,
            [keyName]: newKeyValue
          }
        };

        return memo;
      }, {}))
    }
  };
}

function updateHasManyAssociation(resources, { key, type, status, item: associatedItem, previousValues }, { relationType, foreignKeyName, name, keyName }) {

  if (status === SUCCESS) {
    const associationValues = associatedItem.values;
    const newForeignKeys = arrayFrom(associationValues[foreignKeyName] || associationValues[toPlural(foreignKeyName)]);

    if (previousValues) {
      const previousForeignKeys = arrayFrom(previousValues[foreignKeyName] || previousValues[toPlural(foreignKeyName)]);
      const addedAssociationKeys = valuesAdded(newForeignKeys, previousForeignKeys);
      const removedAssociationKeys = valuesRemoved(newForeignKeys, previousForeignKeys);

      return {
        ...resources,
        items: {
          ...resources.items,

          ...(addedAssociationKeys.reduce((memo, addedKey) => {
            const item = resources.items[addedKey];

            const newKeys = function(){
              if (relationType === 'hasAndBelongsToMany') {
                return [
                  key,
                  ...without(item.values[keyName] || [], key)
                ];
              } else {
                return key;
              }
            }();

            if (item) {
              memo[addedKey] = {
                ...item,
                values: {
                  ...item.values,
                  [keyName]: newKeys
                }
              };
            }

            return memo;
          }, {})),

          ...(removedAssociationKeys.reduce((memo, addedKey) => {
            const item = resources.items[addedKey];

            const newValues = function(){
              if (relationType === 'hasAndBelongsToMany') {
                return {
                  ...item.values,
                  [keyName]: without(item.values[keyName] || [], key)
                };
              } else {
                return without(item.values, keyName);
              }
            }();

            if (item) {
              memo[addedKey] = {
                ...item,
                values: newValues
              };
            }

            return memo;
          }, {}))
        }
      };

    } else {
      assertInDevMode(() => {
        warn(
          `${type} did not specify any previous values. This makes updating '${name}.${keyName}' much ` +
          'less efficient. Use the previousValues option for updateItem() to specify these values.'
        );
      });

      return {
        ...resources,
        items: Object.keys(resources.items).reduce((memo, itemKey) => {
          const item = resources.items[itemKey];

          const newValues = function(){
            if (contains(newForeignKeys, itemKey, { stringifyFirst: true })) {
              if (relationType === 'hasAndBelongsToMany') {
                return {
                  ...item.values,
                  [keyName]: [
                    key,
                    ...without(item.values[keyName] || [], key)
                  ]
                };
              } else {
                return {
                  ...item.values,
                  [keyName]: key
                };
              }
            } else {
              if (relationType === 'hasAndBelongsToMany') {
                return {
                  ...item.values,
                  [keyName]: without(item.values[keyName] || [], key)
                };
              } else {
                return without(item.values, keyName);
              }
            }
          }();

          memo[itemKey] = {
            ...item,
            values: newValues
          };

          return memo;
        }, {})
      };

    }

  } else {
    return resources;
  }
}

function removeDestroyedHasManyAssociation(resources, { key, type, status, previousValues }, { dependent, relationType, foreignKeyName, name, keyName, listParameter }) {
  if (status === SUCCESS) {
    const _resources = function(){
      if (isEmpty(previousValues)) {

        assertInDevMode(() => {
          warn(
            `${type} did not specify any previous values. This makes updating '${name}.${keyName}' much less ` +
            'efficient. Use the previousValues option for destroyItem() to specify these values.'
          );
        });

        if (dependent === 'destroy') {
          const itemKeysWithDeletedAssociation = Object.keys(resources.items).filter((associationKey) => {
            const item = resources.items[associationKey];

            return contains(item.values[keyName], associationKey, { stringifyFirst: true });
          });

          return removeItemsFromResources(resources, itemKeysWithDeletedAssociation);

        } else {
          return {
            ...resources,
            items: Object.keys(resources.items).reduce((memo, itemKey) => {
              const item = resources.items[itemKey];

              const newValues = function () {
                if (relationType === 'hasAndBelongsToMany') {
                  return {
                    ...item.values,
                    [keyName]: without(item.values[keyName] || [], key)
                  };
                } else {
                  return without(item.values, keyName);
                }
              }();

              memo[itemKey] = {
                ...item,
                values: newValues
              };

              return memo;
            }, {})
          };
        }

      } else {
        const foreignKeys = arrayFrom(previousValues[foreignKeyName] || previousValues[toPlural(foreignKeyName)]);

        if (dependent === 'destroy') {
          return removeItemsFromResources(resources, foreignKeys);
        } else {

          return {
            ...resources,
            items: {
              ...resources.items,

              ...(foreignKeys.reduce((memo, addedKey) => {
                const item = resources.items[addedKey];

                if (item) {
                  const newValues = function () {
                    if (relationType === 'hasAndBelongsToMany') {
                      return {
                        ...item.values,
                        [keyName]: without(item.values[keyName] || [], key)
                      };
                    } else {
                      return without(item.values, keyName);
                    }
                  }();

                  memo[addedKey] = {
                    ...item,
                    values: newValues
                  };
                }

                return memo;
              }, {}))
            }
          };
        }

      }
    }();

    if (listParameter === false) {

      /**
       * Allow disabling removal of matching lists by passing false to the
       * listParameter option
       */
      return _resources;

    } else {
      const listParameterString = serializeKey({ [listParameter || toSingular(keyName)]: key });

      const lists = Object.keys(_resources.lists).reduce((memo, listKey) => {
        if (!contains(listKey, listParameterString)) {
          memo[listKey] = _resources.lists[listKey];
        }

        return memo;
      }, {});

      return {
        ..._resources,
        lists
      };

    }

  } else {
    return resources;
  }
}

function getForeignKeyName({ foreignKey, as, name }) {
  if (foreignKey) {
    return foreignKey;
  } else {
    if (as) {
      return `${toSingular(as)}Id`;
    } else {
      return `${toSingular(name)}Id`;
    }
  }
}

function getKeyName({ key, relationType, associationName }) {
  if (key) {
    return key;
  } else {
    if (relationType === 'belongsTo') {
      return `${toSingular(associationName)}Id`;
    } else {
      return `${toSingular(associationName)}Ids`;
    }
  }
}

/**
 * @typedef AssociationOptions Accepted options when defining an associated resource
 * @property {ActionDictionary} actions Associated resource's actions
 * @property {string} property Name of the primary key the associate resource uses to refer to this one
 * @property {string} foreignKey Name of the attribute that stores the id or ids of the associated resource
 *          on the current one.
 * @property {string} as If a foreign key is not specified, this association name is used as the prefix with
 *         a suffix of id or ids to derive the foreign key
 * @property {string} dependent When set to 'destroyItem' it removes the associated resource if the current one is
 *        removed from the store.
 * @property {object|string} listParameter The key of the list to add newly created associated
 *        objects to
 */

function addAssociationReducer(
  reducersDict,
  name,
  relationType,
  associationName,
  { actions = {}, foreignKey, as, dependent, key, listParameter }) {

  const foreignKeyName = getForeignKeyName({ foreignKey, as, name });
  const keyName = getKeyName({ key, relationType, associationName });

  const reducerOptions = {
    name,
    relationType,
    foreignKeyName,
    keyName,
    dependent,
    listParameter
  };

  addAssociationReducersTo(reducersDict, { actions, reducerOptions });
}

const associationReducersDict = {
  createItem: addCreatedHasManyAssociation,
  updateItem: updateHasManyAssociation,
  destroyItem: removeDestroyedHasManyAssociation
};

function addAssociationReducersTo(reducersDict, { actions, reducerOptions }) {
  Object.keys(associationReducersDict).forEach((actionKey) => {
    const actionName = actions[actionKey];

    if (actionName) {
      reducersDict[actionName] = {
        reducer: (resources, action) => associationReducersDict[actionKey](resources, action, reducerOptions)
      };
    }
  });
}

export default addAssociationReducer;
