import FirestorePage from './FirestorePage';

export default class FirestorePageManager {
  constructor(fsQueryOrCollectionRef, itemsPerPage) {
    this.fsQuery = fsQueryOrCollectionRef;
    this.itemsPerPage = itemsPerPage;
    this.pages = [];
  }

  get(page) {
    return this.pages[page - 1];
  }

  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.updateCallback = callback;
    }
  }

  async setPage(page) {
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

  async checkLength() {
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

  async onUpdatePage(page, snapshot, lastDocChanged) {
    const index = page - 1;
    if (this.updateCallback) {
      this.updateCallback({ page, snapshot, length: this.length });
      if (lastDocChanged && this.pages[index + 1]) {
        for (let i = page + 1; i <= this.pages.length; i += 1) {
          await this.setPage(i);
          if (i === this.pages.length) {
            await this.checkLength();
          }
          this.updateCallback({
            page: i,
            snapshot: this.pages[i - 1] ? this.pages[i - 1].snapshot : null,
            length: typeof this.length === 'number' ? this.length : Infinity,
          });
        }
      }
    }
  }

  async load(page) {
    const index = page - 1;
    if (!this.pages[index] && (typeof this.length !== 'number' || this.length >= page)) {
      if (index === 0 || this.pages[index - 1]) {
        await this.setPage(page);
      } else {
        for (let i = 1; i <= page; i += 1) {
          await this.load(i);
        }
      }
    }
    if (!this.pages[index + 1]) {
      await this.checkLength();
    }
    return this.pages[index] || null;
  }
}
