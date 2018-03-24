function assertInDevMode(callback) {
  if (process.env.NODE_ENV !== 'production') {
    callback();
  }
}

export default assertInDevMode;
