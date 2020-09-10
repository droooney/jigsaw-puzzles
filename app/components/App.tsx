import React, { useEffect } from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import MuiThemeProvider from '@material-ui/styles/ThemeProvider';
import Button from '@material-ui/core/Button';

import { useBoolean } from 'hooks';

import CreatePuzzleDialog from 'components/CreatePuzzleDialog';

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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
`;

const App: React.FC = () => {
  const {
    value: createPuzzleDialogOpen,
    setTrue: openCreatePuzzleDialog,
    setFalse: closeCreatePuzzleDialog,
  } = useBoolean(false);

  useEffect(() => {
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <MuiThemeProvider theme={theme}>
        <GlobalStyle />

        <CreatePuzzleDialog
          open={createPuzzleDialogOpen}
          onClose={closeCreatePuzzleDialog}
        />

        <Button
          variant="contained"
          color="secondary"
          onClick={openCreatePuzzleDialog}
        >
          Create Puzzle
        </Button>
      </MuiThemeProvider>
    </ThemeProvider>
  );
};

export default React.memo(App);
