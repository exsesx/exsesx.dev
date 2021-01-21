import React from 'react';
import { Route, Switch } from 'react-router-dom';
import About from './About';
import Header from './Header';
import Home from './Home';

interface AppProps {}

function App({}: AppProps) {
  return (
    <>
      <Header />
      <Switch>
        <Route path="/about">
          <About />
        </Route>
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </>
  );
}

export default App;
