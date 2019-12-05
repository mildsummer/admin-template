/**
 * Firestoreでページング処理をするためのユーティリティ
 * ページ単位を扱う
 */
export default class FirestorePage {
  /**
   *
   * @param {firebase.firestore.Query} baseFsQuery
   * @param {firebase.firestore.QueryDocumentSnapshot} startAfter
   * @param {number} itemsPerPage
   */
  constructor(baseFsQuery, startAfter, itemsPerPage) {
    this.hasInitialized = false;
    this.baseFsQuery = baseFsQuery;
    this.itemsPerPage = itemsPerPage;
    this.fsQuery = (startAfter ? baseFsQuery.startAfter(startAfter) : baseFsQuery)
      .limit(itemsPerPage);
  }

  /**
   * データの取得
   * 監視を開始する
   * @returns {Promise<firebase.firestore.QuerySnapshot>}
   */
  async load() {
    this._unsubscribe = this.fsQuery.onSnapshot(this._onSnapshot.bind(this));
    this.snapshot = await this.fsQuery.get();
    return this.snapshot;
  }

  /**
   * startAfterを変更しデータを取得
   * 監視を開始する
   * @param {firebase.firestore.QueryDocumentSnapshot} startAfter
   * @returns {Promise<firebase.firestore.QuerySnapshot>}
   */
  async resetStartAfter(startAfter) {
    this.hasInitialized = false;
    delete this.snapshot;
    this.fsQuery = (startAfter ? this.baseFsQuery.startAfter(startAfter) : this.baseFsQuery)
      .limit(this.itemsPerPage);
    if (this._unsubscribe) {
      this._unsubscribe();
    }
    return this.load();
  }

  /**
   * スナップショットをハンドリング
   * @param {firebase.firestore.QuerySnapshot} snapshot
   */
  _onSnapshot(snapshot) {
    if (!this.hasInitialized || !this.snapshot) {
      this.hasInitialized = true;
    } else {
      const prevLastDoc = this.lastDoc;
      this.snapshot = snapshot;
      const currentLastDoc = this.lastDoc;
      let lastDocChanged = false;
      if (prevLastDoc) {
        lastDocChanged = !prevLastDoc.isEqual(currentLastDoc);
      } else if (currentLastDoc) {
        lastDocChanged = true;
      }
      if (this.onUpdateCallback) {
        this.onUpdateCallback(snapshot, lastDocChanged);
      }
    }
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
   * ページにドキュメントが含まれるかどうかを返す
   * @returns {boolean}
   */
  get hasDocs() {
    return !this.snapshot.empty;
  }

  /**
   * ページの最後のドキュメントを返す
   * @returns {firebase.firestore.QueryDocumentSnapshot | null}
   */
  get lastDoc() {
    return this.hasDocs ? this.snapshot.docs[this.snapshot.docs.length - 1] : null;
  }

  /**
   * 全てのドキュメントを返す
   * @returns {firebase.firestore.QueryDocumentSnapshot[]}
   */
  get docs() {
    return this.hasDocs ? this.snapshot.docs : [];
  }
}
