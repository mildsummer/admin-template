import React from 'react';
import PropTypes from 'prop-types';

const SearchDetail = (props) => {
  const { data } = props;
  return (
    <ul className="search-detail">
      {data.map((item) => (
        <li key={item.label} className="search-detail__item">
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
};

SearchDetail.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  })).isRequired,
};

export default SearchDetail;
