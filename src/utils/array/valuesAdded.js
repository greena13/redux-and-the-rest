function valuesAdded(newValues, previousValues) {
  return newValues.reduce((memo, value) => {
    if (previousValues.indexOf(value) === -1) {
      memo.push(value);
    }

    return memo;
  }, []);
}
export default valuesAdded;
