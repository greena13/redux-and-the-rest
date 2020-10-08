function keysExplicitlyReferencedByListOperations({ push = [], unshift = [], invalidate = [], merge = [] }) {
  return [
    ...push,
    ...unshift,
    ...invalidate,
    ...merge.reduce((memo, mergerKeyPair) => memo.concat(mergerKeyPair[0]), []),
  ];
}

export default keysExplicitlyReferencedByListOperations;
