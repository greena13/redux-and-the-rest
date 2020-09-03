import toSingular from '../../utils/string/toSingular';
import createItem from '../../actions/RESTful/createItem';
import updateItem from '../../actions/RESTful/updateItem';
import destroyItem from '../../actions/RESTful/destroyItem';


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
 * @property {string} name Name of the associated resource type
 *
 * @property {string} foreignKey Name of the attribute that stores the id or ids of the current resource on the
 *           associated one.
 * @property {string} as If a foreign key is not specified, this association name is used with a suffix of
 *           `id` to derive the foreign key.
 *
 * @property {string} key The key to use as the foreign key on this resource, to refer to the associated resource.
 *           If not specified, the associationName with a suffix of `id` for `belongsTo` associations and `ids`
 *           for `belongsToAndHasMany` associations is used.
 *
 * @property {string} dependent Whether to remove the associated resource if the current one is removed from
 *            the store.
 *
 * @property {object|string} listParameter The key of the list to add newly created associated objects to
 */

function addAssociationReducer(
  reducersDict,
  name,

  relationType,

  associationName,
  actions = {},
  { foreignKey, as, dependent, key, listParameter }) {

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
  createItem: createItem.hasManyAssociationsReducer,
  updateItem: updateItem.hasManyAssociationsReducer,
  destroyItem: destroyItem.hasManyAssociationsReducer
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
