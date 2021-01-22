import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import About from './About';
import Header from './Header';
import Home from './Home';

interface AppProps {}

function App({}: AppProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // TODO: Create HOC & listen to resize event
    // Mobile life-hack https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    setReady(true);
  }, []);

  if (!ready) return null;

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
