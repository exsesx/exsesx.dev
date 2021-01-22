import React, { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';
import About from './About';
import Header from './Header';
import Home from './Home';

interface AppProps {}

function App({}: AppProps) {
  useEffect(() => {
    function calculateViewportUnits() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    calculateViewportUnits();
    window.addEventListener('resize', calculateViewportUnits);

    return () => {
      window.removeEventListener('resize', calculateViewportUnits);
    };
  }, []);

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
