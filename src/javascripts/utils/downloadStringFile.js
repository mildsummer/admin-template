/**
 * 文字列からファイルをダウンロード
 * @param {string} string
 * @param {string} fileName
 * @param {string} type
 * @param {boolean} insertTimestampToFilename
 */
export default (string, fileName, type, insertTimestampToFilename) => {
  const downLoadLink = document.createElement('a');
  let name = fileName;
  if (insertTimestampToFilename) {
    const nameArray = name.split('.');
    const timestamp = new Date().toLocaleString().replace(/[/ :]/g, '_');
    nameArray[0] = `${nameArray[0]}_${timestamp}`;
    name = nameArray.join('.');
  }
  downLoadLink.download = name;
  downLoadLink.href = URL.createObjectURL(new Blob([string], { type }));
  downLoadLink.dataset.downloadurl = [type, downLoadLink.download, downLoadLink.href].join(':');
  downLoadLink.click();
};
