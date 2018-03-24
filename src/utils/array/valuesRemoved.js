function valuesRemoved(newValues, previousValues) {
  return previousValues.reduce((memo, value) => {
    if (newValues.indexOf(value) === -1) {
      memo.push(value);
    }

    return memo;
  }, []);
}

export default valuesRemoved;
