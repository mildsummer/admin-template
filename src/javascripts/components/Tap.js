import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import assign from 'lodash.assign';

// utils
const { pow, sqrt } = Math;
const distance = (x1, y1, x2, y2) => (
  sqrt(pow(x1 - x2, 2) + pow(y1 - y2, 2))
);

// constants
const PREFIX_CLASS = 'tap';
const TOUCH_ACTIVE_CLASS = `${PREFIX_CLASS}-active`;
const TOUCH_ACTIVE_END_CLASS = `${PREFIX_CLASS}-end`;
const TOUCH_ACTIVE_THRESHOLD = 10;
const TOUCH_ACTIVE_TIME_THRESHOLD = 2000;
const TOUCH_ACTIVE_END_DURATION = 0;

/**
 * タップ時のクラス切り替え
 */
class Tap extends PureComponent {
  constructor(props) {
    super(props);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchCancel = this.onTouchCancel.bind(this);
    this.state = {
      touchActive: false,
      touchActiveEnd: false,
      touchStartX: 0,
      touchStartY: 0
    };
    this.timers = [];
  }

  /**
   * コンポーネントが消える時にタイマーを切る
   */
  componentWillUnmount() {
    this.timers.forEach((timer) => {
      window.clearTimeout(timer);
    });
  }

  onTouchStart(event) {
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
    this.setState({
      touchActive: true,
      touchActiveEnd: false,
      touchStartX: clientX,
      touchStartY: clientY
    });
    this.timers.push(window.setTimeout(() => {
      this.setState({ touchActive: false, touchActiveEnd: false });
    }, TOUCH_ACTIVE_TIME_THRESHOLD));
  }

  onTouchMove(event) {
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
    const { touchStartX, touchStartY } = this.state;
    if (distance(clientX, clientY, touchStartX, touchStartY) >= TOUCH_ACTIVE_THRESHOLD) {
      this.setState({ touchActive: false, touchActiveEnd: false });
    }
  }

  onTouchEnd() {
    if (this.state.touchActive) {
      this.setState({ touchActive: true, touchActiveEnd: true });
      this.timers.push(window.setTimeout(() => {
        this.setState({ touchActive: false, touchActiveEnd: false });
      }, TOUCH_ACTIVE_END_DURATION));
    }
  }

  onTouchCancel() {
    this.onTouchEnd();
  }

  render() {
    const { touchActive, touchActiveEnd } = this.state;
    const { to, className, style, disabled, component, back, onClick } = this.props;
    const href = to ? `/#${to}` : '#';
    const props = assign({}, this.props, {
      onTouchStart: this.onTouchStart,
      onTouchEnd: this.onTouchEnd,
      onTouchMove: this.onTouchMove,
      onTouchCancel: this.onTouchCancel,
      onMouseDown: this.onTouchStart,
      onMouseUp: this.onTouchEnd,
      onMouseMove: this.onTouchMove,
      href: component ? null : href,
      onClick: back ? (e) => {
        e.preventDefault();
        window.history.back();
      } : (e) => {
        if (onClick) {
          if (!to) {
            e.preventDefault();
          }
          onClick(e);
        }
      },
      className: classNames(
        PREFIX_CLASS,
        className,
        {
          [TOUCH_ACTIVE_CLASS]: touchActive,
          [TOUCH_ACTIVE_END_CLASS]: touchActiveEnd
        }
      ),
      style: disabled ? assign({}, style, {
        pointerEvents: 'none'
      }) : style
    });
    delete props.to;
    delete props.disabled;
    delete props.back;
    delete props.component;
    return React.createElement(this.props.component ? this.props.component : 'a', props);
  }
}

Tap.defaultProps = {
  to: null,
  children: null,
  className: null,
  style: null,
  disabled: false,
  component: null,
  back: false,
  onClick: null
};

Tap.propTypes = {
  to: PropTypes.string, // 遷移先パス
  children: PropTypes.any,
  className: PropTypes.string,
  style: PropTypes.object,
  disabled: PropTypes.bool, // 無効化
  component: PropTypes.any, // コンポーネント種
  back: PropTypes.bool, // 戻るボタンの場合
  onClick: PropTypes.func // クリックイベント
};

export default Tap;
