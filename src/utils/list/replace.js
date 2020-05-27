function replace(target, oldValue, newValue) {
  if (Array.isArray(target)) {
    const oldValueIndex = target.indexOf(oldValue);

    if (oldValueIndex === -1) {
      return [ ...target ];
    } else {
      return [
        ...target.slice(0, oldValueIndex),
        newValue,
        ...target.slice(oldValueIndex + 1),
      ];
    }

  }
}

export default replace;
