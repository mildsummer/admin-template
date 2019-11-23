/**
 * 単純なオブジェクトの配列をCSV文字列に変換
 * @param {Array<object>} array
 * @param {Array<string>} keyArray
 * @returns {string}
 */
export default (array, keyArray = []) => {
  const keys = keyArray;
  array.forEach((data) => {
    Object.keys(data).forEach((key) => {
      if (keys.indexOf(key) === -1) {
        keys.push(key);
      }
    });
  });
  const lineArray = [keys.join(',')].concat(
    array.map((data) => keys.map((key) => {
      let valueString = '';
      if (typeof data[key] === 'number') {
        valueString = data[key];
      } else if (typeof data[key] === 'string') {
        valueString = `"${data[key]}"`;
      } else {
        valueString = `"${JSON.stringify(data[key]).replace(/"/g, '""')}"`;
      }
      return valueString;
    }).join(',')),
  );
  return lineArray.join('\r\n');
};
