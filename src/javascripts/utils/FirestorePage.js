export default class FirestorePage {
  constructor(baseFsQuery, startAfter, itemsPerPage) {
    this.hasInitialized = false;
    this.baseFsQuery = baseFsQuery;
    this.fsQuery = (startAfter ? baseFsQuery.startAfter(startAfter) : baseFsQuery)
      .limit(itemsPerPage);
  }

  async load() {
    this._unsubscribe = this.fsQuery.onSnapshot(this.onSnapshot.bind(this));
    this.snapshot = await this.fsQuery.get();
    return this.snapshot;
  }

  unsubscribe() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  onSnapshot(snapshot) {
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
      if (this.updateCallback) {
        this.updateCallback(snapshot, lastDocChanged);
      }
    }
  }

  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.updateCallback = callback;
    }
  }

  get hasDocs() {
    return !this.snapshot.empty;
  }

  get lastDoc() {
    return this.hasDocs ? this.snapshot.docs[this.snapshot.docs.length - 1] : null;
  }
}
