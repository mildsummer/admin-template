export default (array) => {
  const keys = [];
  array.forEach((data) => {
    Object.keys(data).forEach((key) => {
      if (keys.indexOf(key) === -1) {
        keys.push(key);
      }
    });
  });
  const lineArray = [keys.join(',')].concat(
    array.map((data) => {
      return keys.map((key) => {
        if (typeof data[key] === 'undefined') {
          return '';
        } else if (typeof data[key] === 'number') {
          return data[key];
        } else if (typeof data[key] === 'string') {
          return `"${data[key]}"`;
        } else {
          return `"${JSON.stringify(data[key]).replace(/"/g, '""')}"`;
        }
      }).join(",");
    })
  );
  return lineArray.join("\r\n");
};
