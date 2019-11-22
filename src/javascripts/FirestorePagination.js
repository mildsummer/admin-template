import queryString from 'querystring';
import { ITEM_PER_PAGE, QUERY_STRING_OPTIONS } from './constants/common';

export default class FirestorePagination {
  constructor(baseCollectionRef, orderFieldPath, directionStr = 'asc') {
    this.baseRef = baseCollectionRef;
    this.orderFieldPath = orderFieldPath;
    this.directionStr = directionStr;
    this.map = {};
    this.lastDocMap = {};
    this.pageLengthMap = {};
  }

  _getRef(query, directionStr = this.directionStr) {
    let ref = this.baseRef.orderBy(this.orderFieldPath, directionStr);
    if (query.email) {
      ref = ref.where('email', '==', query.email);
    }
    if (query.address) {
      ref = ref.where('address', '==', query.address);
    }
    return ref;
  }

  async _getLastDoc(query) {
    const snapshot = await this._getRef(query, this.directionStr === 'asc' ? 'desc' : 'asc').limit(1).get();
    return snapshot.docs[0];
  }

  async _loadAllPageTo(query, page) {
    for (let i = 1; i <= page; i++) {
      await this.get(query, i);
    }
  }

  async get(query, page = 1, itemPerPage = ITEM_PER_PAGE) {
    let pageIndex = page ? page - 1 : 0;
    const ref = this._getRef(query);
    const queryKey = queryString.stringify(query, QUERY_STRING_OPTIONS);
    let current = this.map[queryKey];
    let result = null;
    if (current) {
      if (current[pageIndex]) {
        result = current[pageIndex];
      } else if (current[pageIndex - 1]) {
        const prevPageDocs = current[pageIndex - 1].docs;
        const startAfter = prevPageDocs[prevPageDocs.length - 1];
        result = await ref.startAfter(startAfter).limit(itemPerPage).get();
      } else if (current[page]) {
        const endBefore = current[page].docs[0];
        result = await ref.endBefore(endBefore).limit(itemPerPage).get();
      } else if (page <= this.lastDocMap[queryKey]) {
        await this._loadAllPageTo(query, page);
        result = this.map[queryKey][pageIndex];
      }
    } else if (page === 1) {
      result = await ref.limit(itemPerPage).get();
      current = [];
      this.map[queryKey] = current;
      this.lastDocMap[queryKey] = await this._getLastDoc(query);
    } else {
      await this._loadAllPageTo(query, page);
      result = this.map[queryKey][pageIndex];
    }
    if (result && result.docs.length) {
      this.map[queryKey][pageIndex] = result;
      if (this.lastDocMap[queryKey] && result.docs[result.docs.length - 1].isEqual(this.lastDocMap[queryKey])) {
        this.pageLengthMap[queryKey] = page;
      }
    }

    return {
      result,
      length: typeof this.pageLengthMap[queryKey] === 'number' ? this.pageLengthMap[queryKey] : Infinity
    };
  }
}
