import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import assign from 'lodash.assign';
import FirestorePagination from '../utils/FirestorePagination';
import useQuery from './_useQuery';
import SearchForm from '../components/SearchForm';
import Pagination from '../components/Pagination';
import SearchDetail from '../components/SearchDetail';
import UserList from '../components/UserList';
import arrayToCsv from '../utils/arrayToCsv';

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
      placeholder: 'ex) 東京',
    },
  },
];

class List extends Component {
  constructor(props) {
    super(props);
    this.handleChangeQuery = this.handleChangeQuery.bind(this);
    this.export = this.export.bind(this);
    this.dbPagination = new FirestorePagination('/members', 'id', 'desc');
    this.state = {
      data: null,
      isLoading: false,
      pageLength: Infinity,
    };
  }

  componentDidMount() {
    // 初期読み込み
    const { query } = this.props;
    this.fetch(query);
  }

  componentDidUpdate(prevProps) {
    // クエリ変更時に読み込み
    const { query: currentQuery } = this.props;
    if (!isEqual(prevProps.query, currentQuery)) {
      this.fetch(currentQuery);
    }
  }

  /**
   * DB読み込み
   * @param {object} query
   * @returns {Promise<void>}
   */
  async fetch(query = null) {
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
    const csvContent = arrayToCsv(docs.map((doc) => (doc.data())));
    const downLoadLink = document.createElement('a');
    downLoadLink.download = 'data.csv';
    downLoadLink.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }));
    downLoadLink.dataset.downloadurl = ['text/csv', downLoadLink.download, downLoadLink.href].join(':');
    downLoadLink.click();
  }

  /**
   * クエリの変更に対応してURLを変更するFunctionを返す
   * @param {string | Array<string>} queryKey
   * @returns {Function}
   */
  handleChangeQuery(queryKey) {
    const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
    return (...changedQuery) => {
      const { query: currentQuery, navigateByQuery } = this.props;
      const query = assign({}, currentQuery);
      changedQuery.forEach((value, index) => {
        query[keys[index]] = value;
      });
      if (queryKey !== 'page') {
        query.page = 1;
      }
      if (!isEqual(currentQuery, query)) {
        navigateByQuery('', query);
      }
    };
  }

  render() {
    const { data, isLoading, pageLength } = this.state;
    const { query } = this.props;
    return (
      <div className="container">
        <SearchForm
          inputs={SEARCH_CONFIG}
          onSubmit={this.handleChangeQuery(SEARCH_CONFIG.map((input) => (input.key)))}
          defaultValues={SEARCH_CONFIG.map((input) => (query[input.key]))}
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
  navigateByQuery: PropTypes.func.isRequired,
};

export default useQuery(List);
