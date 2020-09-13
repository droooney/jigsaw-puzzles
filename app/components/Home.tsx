import React from 'react';
import Button from '@material-ui/core/Button';
import styled from 'styled-components';

import useBoolean from 'hooks/useBoolean';

import CreatePuzzleDialog from 'components/CreatePuzzleDialog';

const Root = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Home: React.FC = () => {
  const {
    value: createPuzzleDialogOpen,
    setTrue: openCreatePuzzleDialog,
    setFalse: closeCreatePuzzleDialog,
  } = useBoolean(false);

  return (
    <Root>
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
    </Root>
  );
};

export default React.memo(Home);
