import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Calculator } from './container';
import { Header } from './container'


function App() {
  return (
    <div className='app'>
        <Header />
        <Calculator />
    </div>
  );
}

export default App;
