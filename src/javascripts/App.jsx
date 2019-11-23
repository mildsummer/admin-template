import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import List from './containers/List';

export default class App extends Component {
  componentDidMount() {
    document.querySelector('.splash').classList.add('splash--hidden');
  }

  render() {
    return (
      <Router>
        <div className="app-container">
          <Route path="/" exact component={List} />
          <Route path="/list" exact component={List} />
        </div>
      </Router>
    );
  }
}
