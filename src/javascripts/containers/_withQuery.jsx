import { createElement, Component } from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import assign from 'lodash.assign';
import { QUERY_STRING_OPTIONS } from '../constants/common';

export default (WrappedComponent) => {
  class ComponentWithQuery extends Component {
    constructor(props) {
      super(props);
      this.navigateByQuery = this.navigateByQuery.bind(this);
    }

    navigateByQuery(path = null, query) {
      const { location, history } = this.props;
      history.push(`#${path || location.pathname}?${queryString.stringify(query, QUERY_STRING_OPTIONS)}`);
    }

    render() {
      const { location } = this.props;
      const query = queryString.parse((location.hash || location.search).split('?')[1], QUERY_STRING_OPTIONS);
      return createElement(
        WrappedComponent,
        assign({}, this.props, { query, navigateByQuery: this.navigateByQuery }),
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
