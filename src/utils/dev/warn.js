function warn(message) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`Redux and the REST: ${message}`);
  }
}

export default warn;
