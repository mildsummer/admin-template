import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class UserList extends PureComponent {
  render() {
    const { data, loading } = this.props;
    return (
      <div
        className={classNames('user-list', {
          'user-list--loading': loading,
          'user-list--empty': data.length === 0
        })}
      >
        {data.length ? (
          <table className="user-list__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>UID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Address</th>
                <th>CreatedAt</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="user-list__item">
                  <td className="user-list__value">{item.id}</td>
                  <td className="user-list__value">{item.docId}</td>
                  <td className="user-list__value">{item.name}</td>
                  <td className="user-list__value">{item.age}</td>
                  <td className="user-list__value">{item.email || '-'}</td>
                  <td className="user-list__value">{item.address ? item.address : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

UserList.propTypes = {
  loading: PropTypes.bool,
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired
  })).isRequired
};

export default UserList;
