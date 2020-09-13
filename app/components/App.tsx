import React, { useEffect } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import MuiThemeProvider from '@material-ui/styles/ThemeProvider';

import Home from 'components/Home';
import Puzzle from 'components/Puzzle';

import theme from '../theme';

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    height: 100%;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  #root {
    height: 100%;
  }
`;

const App: React.FC = () => {
  useEffect(() => {
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />

      <MuiThemeProvider theme={theme}>
        <BrowserRouter>
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>

            <Route exact path="/puzzle/:puzzleId">
              <Puzzle />
            </Route>

            <Redirect to="/" />
          </Switch>
        </BrowserRouter>
      </MuiThemeProvider>
    </ThemeProvider>
  );
};

export default React.memo(App);
