import queryString from 'querystring';
import flatten from 'lodash.flatten';
import { db } from '../Firebase';
import { ITEM_PER_PAGE, QUERY_STRING_OPTIONS } from '../constants/common';

/**
 * Firestoreでページング処理をするためのユーティリティ
 */
export default class FirestorePagination {
  /**
   *
   * @param {string} baseCollectionPath
   * @param {string} orderFieldPath
   * @param {string} directionStr
   */
  constructor(baseCollectionPath, orderFieldPath, directionStr = 'asc') {
    this.baseRef = db.collection(baseCollectionPath);
    this.orderFieldPath = orderFieldPath;
    this.directionStr = directionStr;
    this.map = {};
    this.lastDocMap = {};
    this.pageLengthMap = {};
  }

  /**
   * Firestoreクエリを生成
   * @param {object} query
   * @param {string} directionStr
   * @returns {firebase.firestore.Query}
   * @private
   */
  _getFSQuery(query, directionStr = this.directionStr) {
    let fsQuery = this.baseRef.orderBy(this.orderFieldPath, directionStr);
    Object.keys(query).forEach((key) => {
      if (query[key] || query[key] === 0) {
        fsQuery = fsQuery.where(key, '==', query[key]);
      }
    });
    return fsQuery;
  }

  /**
   * クエリから最後のドキュメントを取得
   * @param {object} query
   * @returns {Promise<firebase.firestore.QueryDocumentSnapshot>}
   * @private
   */
  async _getLastDoc(query) {
    const snapshot = await this._getFSQuery(query, this.directionStr === 'asc' ? 'desc' : 'asc').limit(1).get();
    return snapshot.docs[0];
  }

  /**
   * 指定したページまでの全てのデータを同期的に取得
   * @param {object} query
   * @param {number} page
   * @returns {Promise<void>}
   * @private
   */
  async _loadAllPageTo(query, page) {
    for (let i = 1; i <= page; i += 1) {
      await this.get(query, i);
    }
  }

  /**
   * 指定したページのデータを取得
   * @param {object} query
   * @param {number} page
   * @param {number} itemPerPage
   * @returns {Promise<{result: firebase.firestore.QuerySnapshot, length: number}>}
   */
  async get(query, page = 1, itemPerPage = ITEM_PER_PAGE) {
    const pageIndex = page ? page - 1 : 0;
    const fsQuery = this._getFSQuery(query);
    const queryKey = queryString.stringify(query, QUERY_STRING_OPTIONS);
    let current = this.map[queryKey];
    let result = null;
    if (current) {
      if (current[pageIndex]) {
        result = current[pageIndex];
      } else if (current[pageIndex - 1]) {
        const prevPageDocs = current[pageIndex - 1].docs;
        const startAfter = prevPageDocs[prevPageDocs.length - 1];
        result = await fsQuery.startAfter(startAfter).limit(itemPerPage).get();
      } else if (current[page]) {
        const endBefore = current[page].docs[0];
        result = await fsQuery.endBefore(endBefore).limit(itemPerPage).get();
      } else if (page <= this.lastDocMap[queryKey]) {
        await this._loadAllPageTo(query, page);
        result = this.map[queryKey][pageIndex];
      }
    } else if (page === 1) {
      result = await fsQuery.limit(itemPerPage).get();
      current = [];
      this.map[queryKey] = current;
      this.lastDocMap[queryKey] = await this._getLastDoc(query);
    } else {
      await this._loadAllPageTo(query, page);
      result = this.map[queryKey][pageIndex];
    }
    if (result && result.docs.length) {
      this.map[queryKey][pageIndex] = result;
      if (this.lastDocMap[queryKey]
        && result.docs[result.docs.length - 1].isEqual(this.lastDocMap[queryKey])) {
        this.pageLengthMap[queryKey] = page;
      }
    } else if (page === 1) {
      this.pageLengthMap[queryKey] = 0;
    }

    return {
      result,
      length: typeof this.pageLengthMap[queryKey] === 'number' ? this.pageLengthMap[queryKey] : Infinity,
    };
  }

  /**
   * ページに関係なく全てのドキュメントを取得
   * @param {object} query
   * @returns {Promise<firebase.firestore.QueryDocumentSnapshot[] | Array>}
   */
  async getAllDocs(query) {
    const queryKey = queryString.stringify(query, QUERY_STRING_OPTIONS);
    let docs = null;
    if (typeof this.pageLengthMap[queryKey] === 'number') {
      docs = flatten(this.map[queryKey].map((snapshot) => (snapshot.docs)));
    } else {
      const result = await this._getFSQuery(query).get();
      docs = result.docs;
    }
    return docs;
  }
}
