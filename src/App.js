import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Calculator } from './container';


function App() {
  return (
    <div className='app'>
        <Calculator />
    </div>
  );
}

export default App;
