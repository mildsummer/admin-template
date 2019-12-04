import queryString from 'querystring';
import flatten from 'lodash.flatten';
import { db } from '../Firebase';
import { ITEM_PER_PAGE, QUERY_STRING_OPTIONS } from '../constants/common';
import FirestorePageManager from './FirestorePageManager';

/**
 * Firestoreでページング処理をするためのユーティリティ
 */
export default class FirestorePagination {
  /**
   * @param {string} baseCollectionPath
   * @param {string} orderFieldPath
   * @param {string} directionStr
   */
  constructor(baseCollectionPath, orderFieldPath, directionStr = 'asc') {
    this.baseRef = db.collection(baseCollectionPath);
    this.orderFieldPath = orderFieldPath;
    this.directionStr = directionStr;
    this.map = {};
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
   * Firestoreクエリに対して変更を監視
   * @param {FirestorePageManager} fsPageManager
   * @param {object} query
   * @private
   */
  _listenSnapshot(fsPageManager, query) {
    fsPageManager.onUpdate(({ snapshot, page, length }) => {
      if (this.onUpdateCallback) {
        this.onUpdateCallback({
          query,
          page,
          snapshot,
          length,
        });
      }
    });
  }

  /**
   * 変更に対するリスナー関数を登録
   * @param {function} callback
   */
  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.onUpdateCallback = callback;
    }
  }

  /**
   * 指定したページのデータを取得
   * @param {object} query
   * @param {number} page
   * @param {number} itemsPerPage
   * @returns {Promise<{result: firebase.firestore.QuerySnapshot, length: number}>}
   */
  async get(query, page = 1, itemsPerPage = ITEM_PER_PAGE) {
    const queryKey = queryString.stringify(query, QUERY_STRING_OPTIONS);
    let fsPageManager = this.map[queryKey];
    let fsPage = null;
    if (fsPageManager) { // すでに同じクエリで取得済み
      fsPage = await fsPageManager.load(page);
    } else { // 初めてのクエリ
      fsPageManager = new FirestorePageManager(this._getFSQuery(query), itemsPerPage);
      fsPage = await fsPageManager.load(page);
      this.map[queryKey] = fsPageManager;
      this._listenSnapshot(fsPageManager, query);
    }

    return {
      result: fsPage && fsPage.snapshot,
      length: typeof fsPageManager.length === 'number' ? fsPageManager.length : Infinity,
    };
  }

  /**
   * ページに関係なく全てのドキュメントを取得
   * @param {object} query
   * @returns {Promise<firebase.firestore.QueryDocumentSnapshot[] | Array>}
   */
  async getAllDocs(query) {
    const queryKey = queryString.stringify(query, QUERY_STRING_OPTIONS);
    let result = null;
    if (typeof this.map[queryKey].length === 'number') {
      result = flatten(this.map[queryKey].pages.map((fsPage) => (fsPage.snapshot.docs)));
    } else {
      const { docs } = await this._getFSQuery(query).get();
      result = docs;
    }
    return result;
  }
}
