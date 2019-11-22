import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import assign from 'lodash.assign';

class SearchForm extends PureComponent {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {
      values: props.defaultValues.concat()
    };
  }

  onChange(index) {
    return (e) => {
      const { onChange } = this.props;
      const { values: currentValues } = this.state;
      const values = currentValues.concat();
      values[index] = e.target.value;
      this.setState({ values });
      if (typeof onChange === 'function') {
        onChange(values);
      }
    }
  }

  onSubmit(e) {
    e.preventDefault();
    const { onSubmit } = this.props;
    const { values } = this.state;
    if (typeof onSubmit === 'function') {
      onSubmit.apply(null, values);
    }
  }

  render() {
    const { values } = this.state;
    const { inputs, submitButtonTitle, onSubmit } = this.props;
    return (
      <form className="search-form" action="#" onSubmit={this.onSubmit}>
        <div className="search-form__field">
          {inputs.map((input, index) => (
            <label className="search-form__item" key={index}>
              <p className="search-form__name">
                {input.label}
              </p>
              <input
                className="search-form__input"
                onChange={this.onChange(index)}
                {...assign({}, input.props, { value: values[index] })}
              />
            </label>
          ))}
        </div>
        <div className="search-form__button-wrapper">
          {onSubmit && <button className="button search-form__button" type="submit">{submitButtonTitle}</button>}
        </div>
      </form>
    );
  }
}

SearchForm.defaultProps = {
  submitButtonTitle: '検索',
  onChange: null,
  onSubmit: null
};

SearchForm.propTypes = {
  inputs: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      props: PropTypes.shape({
        type: PropTypes.oneOf(['text', 'number']).isRequired,
        name: PropTypes.string,
        placeholder: PropTypes.string,
        size: PropTypes.number
      })
    })
  ).isRequired,
  defaultValues: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  submitButtonTitle: PropTypes.string,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func
};

export default SearchForm;
