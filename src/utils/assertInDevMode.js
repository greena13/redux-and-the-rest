function assertInDevMode(callback) {
  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line
    callback();
  }
}

export default assertInDevMode;
