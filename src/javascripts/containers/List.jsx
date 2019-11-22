import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';
import assign from 'lodash.assign';
import { db } from '../Firebase';
import FirestorePagination from "../FirestorePagination";
import withQuery from './_withQuery';
import SearchForm from '../components/SearchForm';
import Pagination from '../components/Pagination';
import SearchDetail from "../components/SearchDetail";
import UserList from "../components/UserList";

const SEARCH_CONFIG = [
  {
    key: 'email',
    label: 'メールアドレス',
    defaultValue: '',
    props: {
      type: 'text',
      name: 'queryEmail',
      placeholder: 'xxx@xxx.xxx'
    }
  },
  {
    key: 'address',
    label: '都道府県',
    defaultValue: '',
    props: {
      type: 'text',
      name: 'queryAddress',
      placeholder: 'ex) 東京'
    }
  }
];

class List extends Component {
  constructor(props) {
    super(props);
    this.handleChangeQuery = this.handleChangeQuery.bind(this);
    this.db = new FirestorePagination(db.collection('/members'), 'id', 'desc');
    this.state = {
      data: null,
      isLoading: false,
      pageLength: Infinity
    };
  }

  componentDidMount() {
    const { query } = this.props;
    this.fetch(query);
  }

  componentWillReceiveProps(nextProps) {
    if (!isEqual(nextProps.query, this.props.query)) {
      this.fetch(nextProps.query);
    }
  }

  async fetch(query = null) {
    this.setState({
      isLoading: true
    });
    const { result, length } = await this.db.get(assign({}, query, { page: null }), query.page || 1);
    this.setState({
      data: result ? result.docs.map((doc) => (doc.data())) : [],
      isLoading: false,
      pageLength: length
    });
  }

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
        navigateByQuery('/', query);
      }
    }
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
            .filter((item) => (item.value))
          }
        />
        {data && (
          <UserList data={data} loading={isLoading} />
        )}
        {data && pageLength ? (
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

List.propTypes = {
  query: PropTypes.object.isRequired,
  navigateByQuery: PropTypes.func.isRequired
};

export default withQuery(List);
