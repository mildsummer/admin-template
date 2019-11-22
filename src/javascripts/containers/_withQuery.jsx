import React, { Component } from 'react';
import PropTypes from "prop-types";
import queryString from 'query-string';

const queryStringOptions = {
  arrayFormat: 'bracket',
  parseNumbers: true,
  parseBooleans: true,
  skipNull: true
};

export default (WrappedComponent) => {
  class ComponentWithQuery extends Component {
    constructor(props) {
      super(props);
      this.navigateByQuery = this.navigateByQuery.bind(this);
    }

    navigateByQuery(path = null, query) {
      const { location, history } = this.props;
      history.push(`#${path || location.pathname}?${queryString.stringify(query, queryStringOptions)}`);
    }

    render() {
      const { location } = this.props;
      const query = queryString.parse((location.hash || location.search).split('?')[1], queryStringOptions);
      return <WrappedComponent {...this.props} query={query} navigateByQuery={this.navigateByQuery} />;
    }
  }

  ComponentWithQuery.propTypes = {
    location: PropTypes.any,
    history: PropTypes.any
  };

  return ComponentWithQuery;
};
