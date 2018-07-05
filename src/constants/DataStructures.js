const RESOURCES = {
  items: {},
  collections: {},
  selectionMap: {},
  newItemKey: null,
};

const RESOURCE = {
  ...ITEM
};

const SHARED_ATTRIBUTES = {
  status: { type: null },
};

const COLLECTION = {
  positions: [],
  ...SHARED_ATTRIBUTES,
};

const ITEM = {
  values: {},
  ...SHARED_ATTRIBUTES,
};

export {
  RESOURCE,
  RESOURCES,
  COLLECTION,
  ITEM,
};
