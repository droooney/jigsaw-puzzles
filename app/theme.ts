import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import purple from '@material-ui/core/colors/purple';
import lightBlue from '@material-ui/core/colors/lightBlue';

export default createMuiTheme({
  palette: {
    primary: purple,
    secondary: lightBlue,
  },
  typography: {
    fontSize: 14,
    fontFamily: '"Trebuchet MS", Helvetica, sans-serif',
  },
});
