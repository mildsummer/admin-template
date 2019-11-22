import mockData from '../_mock/data';

class API {
  fetchData(query) {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        resolve(query ? mockData.filter((item) => (
          (!query.email || (item.email === query.email))
          && (!query.address || (item.address.name === query.address))
        )) : mockData);
      }, 1000);
    });
  }
}

export default new API();
