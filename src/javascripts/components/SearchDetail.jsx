import React from 'react';
import PropTypes from 'prop-types';

const SearchDetail = (props) => (
  <ul className="search-detail">
    {props.data.map((item, index) => (
      <li key={index} className="search-detail__item">
        <p className="search-detail__name">
          {item.label}
        </p>
        <p className="search-detail__value">
          {item.value}
        </p>
      </li>
    ))}
  </ul>
);

SearchDetail.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default SearchDetail;
