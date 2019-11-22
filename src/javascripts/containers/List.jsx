import React, { Component } from 'react';
import PropTypes from 'prop-types';
import API from '../utils/API';
import isEqual from 'lodash.isequal';
import assign from 'lodash.assign';
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
      placeholder: 'ex) 東京都'
    }
  }
];

class List extends Component {
  constructor(props) {
    super(props);
    this.handleChangeQuery = this.handleChangeQuery.bind(this);
    this.state = {
      data: null,
      isLoading: false
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

  fetch(query = null) {
    this.setState({
      isLoading: true
    });
    API.fetchData(query)
      .then(data => this.setState({
        data,
        isLoading: false
      }));
  }

  handleChangeQuery(queryKey) {
    const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
    return (...changedQuery) => {
      const { query: currentQuery, navigateByQuery } = this.props;
      const query = assign({}, currentQuery);
      changedQuery.forEach((value, index) => {
        query[keys[index]] = value;
      });
      if (!isEqual(currentQuery, query)) {
        navigateByQuery('/', query);
      }
    }
  }

  render() {
    const { data, isLoading } = this.state;
    const { query } = this.props;
    const length = 10;
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
        {data && length
          ? <Pagination length={length} current={query.page} onSelect={this.handleChangeQuery('page')} /> : null}
      </div>
    );
  }
}

List.propTypes = {
  query: PropTypes.object.isRequired,
  navigateByQuery: PropTypes.func.isRequired
};

export default withQuery(List);
