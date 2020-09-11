import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

const LoadingOverlay: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
    }}>
      <CircularProgress color="secondary" />
    </div>
  );
};

export default React.memo(LoadingOverlay);
