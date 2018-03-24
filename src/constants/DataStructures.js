const SHARED_ATTRIBUTES = {
  status: { type: null },
};

const RESOURCES = {
  items: {},
  collections: {},
  selectionMap: {},
  newItemKey: null,
};

const COLLECTION = {
  positions: [],
  ...SHARED_ATTRIBUTES,
};

const ITEM = {
  values: {},
  ...SHARED_ATTRIBUTES,
};

const RESOURCE = {
  ...ITEM
};

export {
  RESOURCE,
  RESOURCES,
  COLLECTION,
  ITEM,
};
