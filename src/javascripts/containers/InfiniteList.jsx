import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import assign from 'lodash.assign';
import FirestoreQueryPagination from '../utils/FirestoreQueryPagination';
import withQuery from './_withQuery';
import SearchForm from '../components/SearchForm';
import SearchDetail from '../components/SearchDetail';
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

class InfiniteList extends Component {
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
    };
  }

  componentDidMount() {
    // 初期読み込み
    this.fetch();
  }

  componentDidUpdate(prevProps) {
    // クエリ変更時に読み込み
    const { query: currentQuery } = this.props;
    if (!isEqual(prevProps.query, currentQuery)) {
      this.fetch();
    }
  }

  /**
   * DB読み込み
   * @returns {Promise<void>}
   */
  async fetch() {
    const { page, data } = this.state;
    const { query } = this.props;
    this.setState({ isLoading: true });
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
    const { query } = this.props;
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
      const { query: currentQuery, navigateWithQuery } = this.props;
      const query = assign({}, currentQuery);
      changedQuery.forEach((value, index) => {
        query[keys[index]] = value || value === 0 ? value : null;
      });
      this.setState({ data: [], page: 1 });
      navigateWithQuery(null, query);
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
    } = this.state;
    const { query } = this.props;
    return (
      <div className="container">
        <SearchForm
          inputs={SEARCH_CONFIG}
          onSubmit={this.handleChangeQuery(SEARCH_CONFIG.map((input) => (input.key)))}
          defaultValues={SEARCH_CONFIG.map((input) => (query[input.key] || input.defaultValue))}
        />
        <SearchDetail
          data={SEARCH_CONFIG
            .map((input) => ({ label: input.label, value: query[input.key] }))
            .filter((item) => (item.value))}
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

const queryShape = {};
SEARCH_CONFIG.forEach((input) => {
  queryShape[input.key] = input.props.type === 'number' ? PropTypes.number : PropTypes.string;
});
InfiniteList.propTypes = {
  query: PropTypes.shape(queryShape).isRequired,
  navigateWithQuery: PropTypes.func.isRequired,
};

export default withQuery(InfiniteList);
