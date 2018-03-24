function resourceTypeTransform({ resourceType }, item) {
  return {
    ...item,
    type: resourceType
  };
}

export default resourceTypeTransform;
