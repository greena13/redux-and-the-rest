function capitalize(string) {
  return string.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default capitalize;
