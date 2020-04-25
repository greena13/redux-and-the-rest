function hasKey(object, key) {
  return Reflect.apply(Object.prototype.hasOwnProperty, object, [key]);
}

export default hasKey;
