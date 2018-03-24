function constantize(target) {
  return target.
    replace(/([A-Z])/g, (arg1, match) => `_${match}`).
    replace('-', '_').
    toUpperCase();
}

export default constantize;
