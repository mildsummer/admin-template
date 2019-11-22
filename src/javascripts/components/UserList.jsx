import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const UserList = (props) => (
  <ul
    className={classNames('user-list', {
      'user-list--loading': props.loading,
      'user-list--empty': props.data.length === 0
    })}
  >
    {props.data.map((item) => (
      <li key={item.id} className="user-list__item">
        <p className="user-list__value">{item.id || '-'}</p>
        <p className="user-list__value">{item.email || '-'}</p>
        <p className="user-list__value">{item.address ? item.address : '-'}</p>
      </li>
    ))}
  </ul>
);

UserList.propTypes = {
  loading: PropTypes.bool,
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired
  })).isRequired
};

export default UserList;
