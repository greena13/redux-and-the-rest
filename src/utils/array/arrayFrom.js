function arrayFrom(target) {
  if (Array.isArray(target)) {
    return target;
  } else if (target || target === '') {
    return [target];
  } else {
    return [];
  }
}

export default arrayFrom;
