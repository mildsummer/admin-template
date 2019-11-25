import React, { PureComponent } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class UserList extends PureComponent {
  renderItems() {
    const { data } = this.props;
    return data.length ? (
      <table className="user-list__table">
        <thead>
          <tr>
            <th>ID</th>
            <th>UID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Address</th>
            <th>Email</th>
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
              <td className="user-list__value">{item.address ? item.address : '-'}</td>
              <td className="user-list__value">{item.email || '-'}</td>
              <td className="user-list__value">{new Date(item.createdAt.seconds * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : null;
  }

  render() {
    const {
      infinite,
      height,
      data,
      loading,
      hasMore,
      next,
    } = this.props;
    return (
      <div
        style={infinite ? null : { height }}
        className={classNames('user-list', {
          'user-list--loading': loading,
          'user-list--empty': data.length === 0,
        })}
      >
        {infinite ? (
          <InfiniteScroll
            height={height}
            dataLength={data.length}
            next={next}
            hasMore={hasMore}
            loader={<p>LOADING...</p>}
            scrollThreshold={1}
          >
            {this.renderItems()}
          </InfiniteScroll>
        ) : (this.renderItems())}
      </div>
    );
  }
}

UserList.defaultProps = {
  loading: false,
  height: null,
  infinite: false,
  hasMore: true,
  next: null,
};

UserList.propTypes = {
  height: PropTypes.number,
  loading: PropTypes.bool,
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
  })).isRequired,
  // infinite scroll options
  infinite: PropTypes.bool,
  hasMore: PropTypes.bool,
  next: PropTypes.func,
};

export default UserList;
