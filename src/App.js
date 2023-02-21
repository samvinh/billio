import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Calculator } from './container';


function App() {
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });
  return (
    <div>
      {/* <ThemeProvider theme={darkTheme}> */}
        {/* <CssBaseline /> */}
        <Calculator />
      {/* </ThemeProvider> */}
    </div>
  );
}

export default App;
