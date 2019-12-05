import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import assign from 'lodash.assign';
import FirestoreQueryPagination from '../utils/FirestoreQueryPagination';
import withQuery from './_withQuery';
import SearchForm from '../components/SearchForm';
import Pagination from '../components/Pagination';
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

class List extends Component {
  constructor(props) {
    super(props);
    this.handleChangeQuery = this.handleChangeQuery.bind(this);
    this.export = this.export.bind(this);
    this.dbPagination = new FirestoreQueryPagination('/members', 'id', 'desc');
    this.dbPagination.onUpdate(this.onUpdate.bind(this));
    this.state = {
      data: null,
      isLoading: false,
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

  onUpdate({
    query,
    page,
    snapshot,
    length,
  }) {
    const { query: currentQuery } = this.props;
    const currentPage = typeof currentQuery.page === 'number' ? currentQuery.page : 1;
    if (page === currentPage && !isEqual(currentQuery, query)) {
      this.setState({
        data: snapshot ? snapshot.docs.map((doc) => (doc.data())) : [],
        pageLength: length,
      });
    }
  }

  /**
   * DB読み込み
   * @returns {Promise<void>}
   */
  async fetch() {
    const { query } = this.props;
    this.setState({
      isLoading: true,
    });
    const { result, length } = await this.dbPagination
      .get(assign({}, query, { page: null }), query.page || 1);
    this.setState({
      data: result ? result.docs.map((doc) => (doc.data())) : [],
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
    const docs = await this.dbPagination.getAllDocs(assign({}, query, { page: null }));
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
      if (queryKey !== 'page' || query.page === 1) {
        delete query.page;
      }
      navigateWithQuery(null, query);
    };
  }

  render() {
    const {
      data,
      isLoading,
      pageLength,
    } = this.state;
    const { query } = this.props;
    return (
      <div className="container">
        <SearchForm
          inputs={SEARCH_CONFIG}
          onSubmit={this.handleChangeQuery(SEARCH_CONFIG.map((input) => (input.key)))}
          defaultValues={SEARCH_CONFIG.map((input) => (query[input.key] || input.defaultValue))}
          disabled={isLoading}
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
          <UserList data={data} loading={isLoading} />
        )}
        {data ? (
          <Pagination
            length={pageLength}
            current={query.page}
            onSelect={this.handleChangeQuery('page')}
            disabled={isLoading}
          />
        ) : null}
      </div>
    );
  }
}

const queryShape = {};
SEARCH_CONFIG.forEach((input) => {
  queryShape[input.key] = input.props.type === 'number' ? PropTypes.number : PropTypes.string;
});
List.propTypes = {
  query: PropTypes.shape(queryShape).isRequired,
  navigateWithQuery: PropTypes.func.isRequired,
};

export default withQuery(List);
