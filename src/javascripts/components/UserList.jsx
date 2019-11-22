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
        <p className="user-list__value">{item.address ? item.address.name : '-'}</p>
        <p className="user-list__value">{item.memo || '-'}</p>
      </li>
    ))}
  </ul>
);

UserList.propTypes = {
  loading: PropTypes.bool,
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    address: PropTypes.shape({
      name: PropTypes.string.isRequired
    }).isRequired,
    memo: PropTypes.string.isRequired
  })).isRequired
};

export default UserList;
