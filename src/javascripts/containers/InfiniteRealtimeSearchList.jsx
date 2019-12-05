import React, { Component } from 'react';
import assign from 'lodash.assign';
import FirestoreQueryPagination from '../utils/FirestoreQueryPagination';
import SearchForm from '../components/SearchForm';
import UserList from '../components/UserList';
import arrayToCsv from '../utils/arrayToCsv';
import downloadStringFile from '../utils/downloadStringFile';

const SEARCH_CONFIG = [ // 検索フォームの設定
  {
    key: 'email',
    label: 'メールアドレス',
    defaultValue: '',
    props: {
      type: 'text',
      name: 'queryEmail',
      placeholder: 'xxx@xxx.xxx',
    },
  },
  {
    key: 'address',
    label: '都道府県',
    defaultValue: '',
    props: {
      type: 'text',
      name: 'queryAddress',
      placeholder: 'ex) 東京都',
    },
  },
];
const DURATION = 300;

class InfiniteRealtimeSearchList extends Component {
  constructor(props) {
    super(props);
    this.fetch = this.fetch.bind(this);
    this.fetchNext = this.fetchNext.bind(this);
    this.handleChangeQuery = this.handleChangeQuery.bind(this);
    this.export = this.export.bind(this);
    this.dbPagination = new FirestoreQueryPagination('/members', 'id', 'desc');
    this.state = {
      data: null,
      isLoading: false,
      page: 1,
      pageLength: Infinity,
      query: {},
    };
  }

  componentDidMount() {
    // 初期読み込み
    this.fetch();
  }

  /**
   * DB読み込み
   * @returns {Promise<void>}
   */
  async fetch() {
    const {
      page,
      data,
      isLoading,
      query,
    } = this.state;
    if (!isLoading) {
      this.setState({ isLoading: true });
    }
    const { result, length } = await this.dbPagination.get(query, page);
    const newData = result ? result.docs.map((doc) => (doc.data())) : [];
    this.setState({
      data: (data || []).concat(newData),
      isLoading: false,
      pageLength: length,
    });
  }

  /**
   * CSVエクスポート
   * @returns {Promise<void>}
   */
  async export() {
    const { query } = this.state;
    const docs = await this.dbPagination.getAllDocs(query);
    const csvContent = arrayToCsv(docs.map((doc) => (doc.data())), ['id']);
    downloadStringFile(csvContent, 'members.csv', 'text/csv', true);
  }

  /**
   * クエリの変更に対応してURLを変更するFunctionを返す
   * @param {string | Array<string>} queryKey
   * @returns {Function}
   */
  handleChangeQuery(queryKey) {
    const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
    return (...changedQuery) => {
      window.clearTimeout(this.changeTimer);
      this.changeTimer = window.setTimeout(() => {
        const { query: currentQuery } = this.state;
        const query = assign({}, currentQuery);
        changedQuery.forEach((value, index) => {
          query[keys[index]] = value || value === 0 ? value : null;
        });
        Object.keys(query).forEach((key) => {
          if (query[key] === null) {
            delete query[key];
          }
        });
        this.setState({
          data: [],
          page: 1,
          query,
          isLoading: true,
        }, this.fetch);
      }, DURATION);
    };
  }

  /**
   * 追加読み込み
   */
  fetchNext() {
    const { page } = this.state;
    this.setState({ page: page + 1 });
    this.fetch();
  }

  render() {
    const {
      data,
      page,
      pageLength,
      isLoading,
      query,
    } = this.state;
    return (
      <div className="container">
        <SearchForm
          inputs={SEARCH_CONFIG}
          onChange={this.handleChangeQuery(SEARCH_CONFIG.map((input) => (input.key)))}
          defaultValues={SEARCH_CONFIG.map((input) => (query[input.key] || input.defaultValue))}
        />
        <button
          className="button"
          type="button"
          onClick={this.export}
        >
          CSVエクスポート
        </button>
        {data && (
          <UserList
            infinite
            height={200}
            data={data}
            next={this.fetchNext}
            hasMore={pageLength > page}
            isLoading={isLoading}
          />
        )}
      </div>
    );
  }
}

export default InfiniteRealtimeSearchList;
