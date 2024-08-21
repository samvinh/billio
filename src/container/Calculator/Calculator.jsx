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
  handleInputChange,
  handleNumericChange,
  handleSwitchChange,
  handleAddItem,
  handleClearData,
  handleDeselectAll,
  handleRemoveSelected,
} from '../../handlers/handlers';

const Calculator = () => {
  const [billName, setBillName] = useState('')

  const [options, setOptions] = useState(false)
  const [splitDivisor, setSplitDivisor] = useState(1)
  const [splitAmount, setSplitAmount] = useState(0)

  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [discount, setDiscount] = useState(0)

  const [taxPercentage, setTaxPercentage] = useState(0);
  const [tax, setTax] = useState(0)

  const [tip, setTip] = useState(0);

  const [subtotal, setSubtotal] = useState(0)
  const [total, setTotal] = useState(0)

  const [rowData, setRowData] = useState([])

  const gridRef = useRef()

  const calculateAll = useCallback(() => {
    if (!gridRef.current) {
      // No data available for calculation
      return;
    }
    const rowData = [];
  
    if (gridRef.current?.api) {
      gridRef.current.api.forEachNode(node => rowData.push(node.data));
    }
    setRowData(rowData);
    window.localStorage.setItem('rowData', JSON.stringify(rowData));
  
    const rawSubtotal = rowData.reduce(
      (sum, { qty, price }) => (qty && price ? sum + qty * price : sum),
      0
    );
    const roundedSubtotal = Math.round(rawSubtotal * 100) / 100;
    setSubtotal(roundedSubtotal);
  
    let rawDiscount = 0;
    let roundedDiscount = 0;
  
    if (discountPercentage > 0) {
      rawDiscount = rawSubtotal * (discountPercentage / 100);
      roundedDiscount = Math.round(rawDiscount * 100) / 100;
      setDiscount(roundedDiscount);
    } else {
      setDiscount(0);
    }
  
    const taxableAmount = rawSubtotal - rawDiscount;
    const rawTax = taxableAmount * (taxPercentage / 100);
    const roundedTax = Math.round(rawTax * 100) / 100;
    setTax(roundedTax);
  
    const rawTotal = taxableAmount + roundedTax + Number(tip);
    const roundedTotal = Math.round(rawTotal * 100) / 100;
    setTotal(roundedTotal);
  
    if (splitDivisor > 0) {
      const rawSplitAmount = rawTotal / splitDivisor;
      const roundedSplitAmount = Math.round(rawSplitAmount * 100) / 100;
      setSplitAmount(roundedSplitAmount);
    }
  }, [taxPercentage, discountPercentage, tip, splitDivisor]);
  

  // Persisting data between refresh
  useEffect(() => {
    const billName = window.localStorage.getItem('billName') != null ? window.localStorage.getItem('billName') : ''
    const rowData = window.localStorage.getItem('rowData') != null ? JSON.parse(window.localStorage.getItem('rowData')) : []
    const discountPercentage = window.localStorage.getItem('discountPercentage') != null ? window.localStorage.getItem('discountPercentage') : 0
    const taxPercentage = window.localStorage.getItem('taxPercentage') != null ? window.localStorage.getItem('taxPercentage') : 0
    const tip = window.localStorage.getItem('tip') != null ? window.localStorage.getItem('tip') : 0
    const splitDivisor = window.localStorage.getItem('splitDivisor') != null ? window.localStorage.getItem('splitDivisor') : 1

    setBillName(billName)
    setRowData(rowData)
    setDiscountPercentage(discountPercentage)
    setTaxPercentage(taxPercentage)
    setTip(tip)
    setSplitDivisor(splitDivisor)
  }, []);

  // Updates local storage whenever the bill name changes or row data changes
  useEffect(() => {
    window.localStorage.setItem('billName', billName)
    window.localStorage.setItem('rowData', JSON.stringify(rowData))
  }, [billName, rowData]);

  // Updates local storage and recalculates the bill whenever option values change
  useEffect(() => {
    window.localStorage.setItem('discountPercentage', discountPercentage);
    window.localStorage.setItem('taxPercentage', taxPercentage);
    window.localStorage.setItem('tip', tip);
    window.localStorage.setItem('splitDivisor', splitDivisor);

    // Ensure grid contains data, otherwise calculateAll() will run, perform calculations, 
    // then reset local storage prematurely
    if(rowData.length > 0){
      calculateAll()
    }
  }, [rowData.length, taxPercentage, discountPercentage, tip, splitDivisor, calculateAll])

  const handleBillNameChange = handleInputChange(setBillName);
  const handleOptionsChange = handleSwitchChange(setOptions);
  const handleTaxPercentageChange = handleNumericChange(setTaxPercentage);
  const handleDiscountPercentageChange = handleNumericChange(setDiscountPercentage);
  const handleTipChange = handleNumericChange(setTip);
  const handleSplitDivisorChange = handleNumericChange(setSplitDivisor, 1);

  const addItem = handleAddItem(gridRef);
  const clearData = handleClearData(gridRef, calculateAll, (newState) => {
    setBillName(newState.billName);
    setDiscount(newState.discount);
    setDiscountPercentage(newState.discountPercentage);
    setTax(newState.tax);
    setTaxPercentage(newState.taxPercentage);
    setTip(newState.tip);
    setSplitDivisor(newState.splitDivisor);
    setSplitAmount(newState.splitAmount);
  });
  const deselect = handleDeselectAll(gridRef);
  const onRemoveSelected = handleRemoveSelected(gridRef, calculateAll);

  let splitDivisorText = splitDivisor > 1 ? `Split ${splitDivisor}-ways` : `Split ${splitDivisor}-way`

  return (
    <ThemeProvider theme={theme}>
      <div className='calculator-container'>
        <div className='full-height'>
          <TextField
            id="billName"
            value={billName}
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
                rowData={rowData}
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
          {/* <Button variant='contained' color='neutral' onClick={() => getRowData()}>Data</Button> */}
        </div>
        <div className='options-container'>
          <FormControlLabel color='primary' control={<Switch value={options} onChange={handleOptionsChange}/>} label="Options" />
          {options && <div>
            <TextField
              id="discount-percentage"
              value={discountPercentage}
              type="number"
              variant="standard"
              label="Discount percent"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{
                min: 0, 
                step: '.1'
              }}
              onChange={handleDiscountPercentageChange}
            />
            <TextField
              id="tax-percentage"
              value={taxPercentage}
              type="number"
              variant="standard"
              label="Tax percent"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{
                min: 0, 
                step: '.1'
              }}
              onChange={handleTaxPercentageChange}
            />
            <TextField
              id="tip"
              value={tip}
              type="number"
              variant="standard"
              label="Tip"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{
                min: 0, 
                step: '.01'
              }}
              onChange={handleTipChange}
            />
            <TextField
              id="split-divisor"
              value={splitDivisor}
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
          <Typography variant='body1'>Subtotal: ${subtotal.toFixed(2)}</Typography>
          {discount > 0 && <Typography variant='body1'>Discount: -${discount.toFixed(2)}</Typography>}
          <Typography variant='body1'>Tax: ${tax.toFixed(2)}</Typography>
          {tip > 0 && <Typography variant='body1'>Tip: ${Number(tip).toFixed(2)}</Typography>}
          <Typography variant='body1'><strong>Total: ${total.toFixed(2)}</strong></Typography>
          {splitAmount > 0 && splitDivisor > 0 && <Typography variant='body1'>Split: ${splitAmount.toFixed(2)}</Typography>}
        </div>
      </div>
    </ThemeProvider>
  )
}

export default Calculator