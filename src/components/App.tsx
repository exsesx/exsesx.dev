import React from 'react';
import Home from './Home';

interface AppProps {}

function App({}: AppProps) {
  return (
    <div className="bg-white dark:bg-gray-800 h-screen">
      <Home />
    </div>
  );
}

export default App;
