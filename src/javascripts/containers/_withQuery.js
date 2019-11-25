import { createElement, Component } from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import assign from 'lodash.assign';
import { QUERY_STRING_OPTIONS } from '../constants/common';

/**
 * react-routerのlocationからクエリを取得して扱いやすくするためのラッパーコンポーネントを生成
 * @param {Component} WrappedComponent
 * @returns {ComponentWithQuery}
 */
export default (WrappedComponent) => {
  class ComponentWithQuery extends Component {
    constructor(props) {
      super(props);
      this.navigateWithQuery = this.navigateWithQuery.bind(this);
    }

    /**
     * クエリを渡してハッシュ遷移
     * @param {string} path
     * @param {object} query
     */
    navigateWithQuery(path = '', query) {
      const { history, location } = this.props;
      let qs = queryString.stringify(query, QUERY_STRING_OPTIONS);
      if (qs) {
        qs = `?${qs}`;
      }
      if (qs !== location.search) {
        history.push(`${path ? `#${path}` : location.pathname}${qs}`);
      }
    }

    render() {
      const { location } = this.props;
      const query = queryString.parse((location.search).split('?')[1], QUERY_STRING_OPTIONS);
      return createElement(
        WrappedComponent,
        assign({}, this.props, { query, navigateWithQuery: this.navigateWithQuery }),
      );
    }
  }

  ComponentWithQuery.propTypes = {
    location: PropTypes.shape({
      hash: PropTypes.string.isRequired,
      search: PropTypes.string.isRequired,
      pathname: PropTypes.string.isRequired,
    }).isRequired,
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
  };

  return ComponentWithQuery;
};
