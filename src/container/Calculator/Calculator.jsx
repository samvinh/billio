import React, { useState, useRef, useCallback, useEffect} from 'react'
import { AgGridReact } from 'ag-grid-react'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import 'ag-grid-community/styles/ag-grid.css' // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css' // Optional theme CSS
import './Calculator.css'

import { ThemeProvider } from '@mui/material/styles';
import theme from '../../themes/themes';
import { defaultColDef, gridStyle, columnDefs } from '../../config/gridConfig';
import {
  handleAddItem,
  handleClearData,
  handleDeselectAll,
  handleRemoveSelected,
} from '../../handlers/handlers';

const Calculator = () => {
  const [state, setState] = useState({
    billName: '',
    options: false,
    splitDivisor: 1,
    splitAmount: 0,
    discountPercentage: 0,
    discount: 0,
    taxPercentage: 0,
    tax: 0,
    tip: 0,
    subtotal: 0,
    total: 0,
    rowData: [],
  });

  const gridRef = useRef()

  const calculateAll = useCallback(() => {
    if (!gridRef.current) return;
  
    const api = gridRef.current.api;
    const rowData = getRowData(api);
    const subtotal = calculateSubtotal(rowData);
    const discount = calculateDiscount(subtotal, state.discountPercentage);
    const tax = calculateTax(subtotal, discount, state.taxPercentage);
    const total = calculateTotal(subtotal, discount, tax, state.tip);
    const splitAmount = calculateSplitAmount(total, state.splitDivisor);
  
    setState(prevState => ({
      ...prevState,
      rowData,
      subtotal,
      discount,
      tax,
      total,
      splitAmount
    }));
  
    window.localStorage.setItem('rowData', JSON.stringify(rowData));
  }, [state.discountPercentage, state.taxPercentage, state.tip, state.splitDivisor]);
  
  // Persisting data between refresh
  useEffect(() => {
    const billName = window.localStorage.getItem('billName') != null ? window.localStorage.getItem('billName') : ''
    const rowData = window.localStorage.getItem('rowData') != null ? JSON.parse(window.localStorage.getItem('rowData')) : []
    const discountPercentage = window.localStorage.getItem('discountPercentage') != null ? window.localStorage.getItem('discountPercentage') : 0
    const taxPercentage = window.localStorage.getItem('taxPercentage') != null ? window.localStorage.getItem('taxPercentage') : 0
    const tip = window.localStorage.getItem('tip') != null ? window.localStorage.getItem('tip') : 0
    const splitDivisor = window.localStorage.getItem('splitDivisor') != null ? window.localStorage.getItem('splitDivisor') : 1

    setState(prevState => ({
      ...prevState,
      billName,
      rowData,
      discountPercentage,
      taxPercentage,
      tip,
      splitDivisor
    }));
  }, []);

  // Updates local storage whenever the bill name changes or row data changes
  useEffect(() => {
    window.localStorage.setItem('billName', state.billName);
    window.localStorage.setItem('rowData', JSON.stringify(state.rowData));
  }, [state.billName, state.rowData]);
  

  // Updates local storage and recalculates the bill whenever option values change
  useEffect(() => {
    window.localStorage.setItem('discountPercentage', state.discountPercentage);
    window.localStorage.setItem('taxPercentage', state.taxPercentage);
    window.localStorage.setItem('tip', state.tip);
    window.localStorage.setItem('splitDivisor', state.splitDivisor);
  
    if (state.rowData.length > 0) {
      calculateAll();
    }
  }, [state.rowData.length, state.taxPercentage, state.discountPercentage, state.tip, state.splitDivisor, calculateAll]);

  const handleBillNameChange = (e) => setState(prevState => ({ ...prevState, billName: e.target.value }));
  const handleOptionsChange = (e) => setState(prevState => ({ ...prevState, options: e.target.checked }));
  const handleTaxPercentageChange = (e) => setState(prevState => ({ ...prevState, taxPercentage: parseFloat(e.target.value) }));
  const handleDiscountPercentageChange = (e) => setState(prevState => ({ ...prevState, discountPercentage: parseFloat(e.target.value) }));
  const handleTipChange = (e) => setState(prevState => ({ ...prevState, tip: parseFloat(e.target.value) }));
  const handleSplitDivisorChange = (e) => setState(prevState => ({ ...prevState, splitDivisor: parseInt(e.target.value, 10) }));  

  const addItem = handleAddItem(gridRef);
  const clearData = handleClearData(gridRef, calculateAll, (newState) => {
    setState(prevState => ({
      ...prevState,
      billName: newState.billName,
      discount: newState.discount,
      discountPercentage: newState.discountPercentage,
      tax: newState.tax,
      taxPercentage: newState.taxPercentage,
      tip: newState.tip,
      splitDivisor: newState.splitDivisor,
      splitAmount: newState.splitAmount
    }));
  });
  const deselect = handleDeselectAll(gridRef);
  const onRemoveSelected = handleRemoveSelected(gridRef, calculateAll);
  

  const splitDivisorText = state.splitDivisor > 1 ? `Split ${state.splitDivisor}-ways` : `Split ${state.splitDivisor}-way`;

  return (
    <ThemeProvider theme={theme}>
      <div className='calculator-container'>
        <div className='full-height'>
          <TextField
            id="billName"
            value={state.billName}
            variant="standard"
            label="Bill Name"
            onChange={handleBillNameChange}
          />
          <div className='button-group'>
            <Button variant='outlined' color='primary' onClick={clearData}>Clear Data</Button>
            <Button variant='outlined' color='danger' onClick={onRemoveSelected}>Remove Selected</Button>
          </div>
          <div className='flex-grow'>
            <div style={gridStyle} className="ag-theme-alpine">
              <AgGridReact
                ref={gridRef}
                rowData={state.rowData}
                columnDefs={columnDefs}
                singleClickEdit={true}
                defaultColDef={defaultColDef}
                domLayout={'autoHeight'}
                rowSelection={'multiple'}
                animateRows={true}
                stopEditingWhenCellsLoseFocus={true}
                onCellEditingStopped={() => calculateAll()}
              ></AgGridReact>
            </div>
          </div>
        </div>
        <div className='center-content'>
          <Button sx={{ ml: '2em', mr: '2em', mt: '1em'}} variant='standard' color='neutral' onClick={() => deselect()}>Unselect All</Button>
          <Button sx={{ ml: '2em', mr: '2em', mt: '1em'}} variant='contained' color='primary' startIcon={<AddCircleIcon />} onClick={() => addItem(undefined)}>Add Item</Button>
        </div>
        <div className='options-container'>
          <FormControlLabel color='primary' control={<Switch checked={state.options} onChange={handleOptionsChange}/>} label="Options" />
          {state.options && <div>
            <TextField
              id="discount-percentage"
              value={state.discountPercentage}
              type="number"
              variant="standard"
              label="Discount percent"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{
                min: 0, 
                step: '1'
              }}
              onChange={handleDiscountPercentageChange}
            />
            <TextField
              id="tax-percentage"
              value={state.taxPercentage}
              type="number"
              variant="standard"
              label="Tax percent"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{
                min: 0, 
                step: '1'
              }}
              onChange={handleTaxPercentageChange}
            />
            <TextField
              id="tip"
              value={state.tip}
              type="number"
              variant="standard"
              label="Tip"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{
                min: 0, 
                step: '1'
              }}
              onChange={handleTipChange}
            />
            <TextField
              id="split-divisor"
              value={state.splitDivisor}
              type="number"
              variant="standard"
              label={splitDivisorText}
              inputProps={{
                min: 1, 
              }}
              onChange={handleSplitDivisorChange}
            />
          </div>}
        </div>
        <div className='cost-breakdown'>
          <Typography variant='body1'>Subtotal: ${state.subtotal.toFixed(2)}</Typography>
          {state.discount > 0 && <Typography variant='body1'>Discount: -${state.discount.toFixed(2)}</Typography>}
          <Typography variant='body1'>Tax: ${state.tax.toFixed(2)}</Typography>
          {state.tip > 0 && <Typography variant='body1'>Tip: ${Number(state.tip).toFixed(2)}</Typography>}
          <Typography variant='body1'><strong>Total: ${state.total.toFixed(2)}</strong></Typography>
          {state.splitAmount > 0 && state.splitDivisor > 1 && <Typography variant='body1'>Split: ${state.splitAmount.toFixed(2)}</Typography>}
        </div>
      </div>
    </ThemeProvider>
  )
}

const getRowData = (api) => {
  const rowData = [];
  api.forEachNode(node => rowData.push(node.data));
  return rowData;
};

const calculateSubtotal = (rowData) => {
  return rowData.reduce(
    (sum, { qty, price }) => (qty && price ? sum + qty * price : sum),
    0
  );
};

const calculateDiscount = (subtotal, discountPercentage) => {
  return discountPercentage > 0 ? Math.round((subtotal * (discountPercentage / 100)) * 100) / 100 : 0;
};

const calculateTax = (subtotal, discount, taxPercentage) => {
  const taxableAmount = subtotal - discount;
  return Math.round((taxableAmount * (taxPercentage / 100)) * 100) / 100;
};

const calculateTotal = (subtotal, discount, tax, tip) => {
  return Math.round((subtotal - discount + tax + Number(tip)) * 100) / 100;
};

const calculateSplitAmount = (total, splitDivisor) => {
  return splitDivisor > 0 ? Math.round((total / splitDivisor) * 100) / 100 : 0;
};

export default Calculator