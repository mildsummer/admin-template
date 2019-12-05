import flatten from 'lodash.flatten';
import FirestorePage from './FirestorePage';

/**
 * Firestoreでページング処理をするためのユーティリティ
 * 一つの検索クエリでの全てのページを扱う
 */
export default class FirestorePageManager {
  /**
   *
   * @param {firebase.firestore.Query | firebase.firestore.CollectionReference} fsQueryOrCollectionRef
   * @param {number} itemsPerPage
   */
  constructor(fsQueryOrCollectionRef, itemsPerPage) {
    this.fsQuery = fsQueryOrCollectionRef;
    this.itemsPerPage = itemsPerPage;
    this.pages = [];
  }

  /**
   * ページ番号を指定してFirestorePageインスタンスを返す
   * @param {number} page
   * @returns {FirestorePage}
   */
  get(page) {
    return this.pages[page - 1];
  }

  /**
   * データの変更時に呼ばれる関数をセットする
   * @param {function} callback
   */
  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.onUpdateCallback = callback;
    }
  }

  /**
   * ページ番号を指定してFirebasePageを初期化
   * あるいはstartAfterを更新する
   * @param {number} page
   * @returns {Promise<void>}
   */
  async _setPage(page) {
    const index = page - 1;
    const startAfter = index === 0 ? null : this.pages[index - 1].lastDoc;
    if (this.pages[index]) {
      await this.pages[index].resetStartAfter(startAfter);
    } else {
      const fsPage = new FirestorePage(this.fsQuery, index === 0
        ? null : startAfter, this.itemsPerPage);
      fsPage
        .onUpdate((snapshot, lastDocChanged) => this.onUpdatePage(page, snapshot, lastDocChanged));
      await fsPage.load();
      this.pages[index] = fsPage;
    }
  }

  /**
   * 最大のページ数をチェックして更新する
   * @returns {Promise<void>}
   */
  async _checkLength() {
    this.pages = this.pages.filter((fsPage) => (fsPage.hasDocs));
    const currentLength = this.pages.length;
    const nextDocQuerySnapshot = await this.fsQuery
      .startAfter(this.pages[currentLength - 1].lastDoc)
      .limit(1).get();
    if (!nextDocQuerySnapshot.docs.length) {
      this.length = currentLength;
    } else if (typeof this.length === 'number') {
      delete this.length;
    }
  }

  /**
   * ページのデータ更新時に呼ばれる
   * そのページの最後のドキュメントが変わったらそれ以降のページも更新する
   * @param {number} page
   * @param {firebase.firestore.QuerySnapshot} snapshot
   * @param {boolean} lastDocChanged
   * @returns {Promise<void>}
   */
  async onUpdatePage(page, snapshot, lastDocChanged) {
    const index = page - 1;
    if (this.onUpdateCallback) {
      this.onUpdateCallback({ page, snapshot, length: this.length });
      if (lastDocChanged && this.pages[index + 1]) {
        for (let i = page + 1; i <= this.pages.length; i += 1) {
          await this._setPage(i);
          if (i === this.pages.length) {
            await this._checkLength();
          }
          this.onUpdateCallback({
            page: i,
            snapshot: this.pages[i - 1] ? this.pages[i - 1].snapshot : null,
            length: typeof this.length === 'number' ? this.length : Infinity,
          });
        }
      }
    }
  }

  /**
   * ページ番号を指定してデータを取得
   * @param {number} page
   * @returns {Promise<FirestorePage | null>}
   */
  async load(page) {
    const index = page - 1;
    if (!this.pages[index] && (typeof this.length !== 'number' || this.length >= page)) {
      if (index === 0 || this.pages[index - 1]) {
        await this._setPage(page);
      } else {
        for (let i = 1; i <= page; i += 1) {
          await this.load(i);
        }
      }
    }
    if (!this.pages[index + 1]) {
      await this._checkLength();
    }
    return this.pages[index] || null;
  }

  /**
   * 全てのドキュメントを取得
   * @returns {Promise<firebase.firestore.QueryDocumentSnapshot[]>}
   */
  async getAllDocs() {
    let result = [];
    if (typeof this.length === 'number') {
      result = flatten(this.pages.map((fsPage) => (fsPage.docs)));
    } else {
      const { docs } = await this.fsQuery.get();
      result = docs;
    }
    return result;
  }
}
