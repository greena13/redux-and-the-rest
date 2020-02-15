import { COLLECTION } from '../../constants/DataStructures';

function applyCollectionOperators(collections, collectionOperations = {}, temporaryKey) {
  const updatedCollections = {};

  collectionOperations.push.forEach((collectionKey) => {
    const existingCollection = collections[collectionKey] || COLLECTION;

    updatedCollections[collectionKey] = {
      ...existingCollection,
      positions: [
        ...existingCollection.positions,
        temporaryKey
      ]
    };
  });

  collectionOperations.unshift.forEach((collectionKey) => {
    const existingCollection = collections[collectionKey] || COLLECTION;

    updatedCollections[collectionKey] = {
      ...existingCollection,
      positions: [
        temporaryKey,
        ...existingCollection.positions
      ]
    };
  });

  collectionOperations.invalidate.forEach((collectionKey) => {
    updatedCollections[collectionKey] = COLLECTION;
  });

  return {
    ...collections,
    ...updatedCollections
  };
}

export default applyCollectionOperators;
