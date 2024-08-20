import React, { useState, useRef, useMemo, useCallback, useEffect} from 'react'
import { AgGridReact } from 'ag-grid-react' // the AG Grid React Component
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

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    neutral: {
      main: '#555A4D',
    },
    primary: {
      main: '#2ED2BD'
    },
    danger: {
      main: '#2E3D34',
    },
  },
});

const Calculator = () => {
  const [billName, setBillName] = useState('')

  const [options, setOptions] = useState(false)
  const [splitDivisor, setSplitDivisor] = useState(1)
  const [splitAmount, setSplitAmount] = useState(null)

  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [discount, setDiscount] = useState(null)

  const [taxPercentage, setTaxPercentage] = useState(0);
  const [tax, setTax] = useState(0)

  const [tip, setTip] = useState(0);

  const [subtotal, setSubtotal] = useState(0)
  const [total, setTotal] = useState(0)

  const [rowData, setRowData] = useState([])
  const [columnDefs] = useState([
    {field: 'qty', flex: 1, editable: true, valueParser: params => Number(params.newValue)},
    {field: 'name', flex: 3, editable: true, wrapText: true, autoHeight: true, resizable: true},
    {field: 'price', flex: 1,  editable: true, valueParser: params => Number(params.newValue)}
  ])
  const defaultColDef = useMemo(() => {
    return {
      resizable: true,
    }
  }, [])

  const calculateAll = useCallback(() => {
    const rowData = []
    if(gridRef.current.api){
      gridRef.current.api.forEachNode(function (node) {
        rowData.push(node.data)
      }
    )    
    setRowData(rowData)
    window.localStorage.setItem('rowData', JSON.stringify(rowData))

    let rawSubtotal = rowData.reduce((sum, cur) => {
      if(cur.qty && cur.price){
        return sum + Number((cur.qty * cur.price))
      }
      else 
        return sum
    }, 0)
    let roundedSubtotal = Math.round(rawSubtotal * 100) / 100
    setSubtotal(roundedSubtotal)
    if(discountPercentage > 0) {
      let rawDiscount = rawSubtotal * (discountPercentage / 100)
      let roundedDiscount = Math.round(rawDiscount * 100) / 100
      setDiscount(roundedDiscount)
      let rawTax = (rawSubtotal - rawDiscount) * (taxPercentage / 100)
      let roundedTax = Math.round(rawTax * 100) / 100
      setTax(roundedTax);
      let rawTotal = (rawSubtotal - rawDiscount) +  rawTax  + Number(tip)
      let roundedTotal = Math.round(rawTotal * 100) / 100
      setTotal(roundedTotal)
      if(splitDivisor > 0){
        let rawSplitAmount = rawTotal / splitDivisor
        let roundedSplitAmount = Math.round(rawSplitAmount * 100) / 100
        setSplitAmount(roundedSplitAmount)
      }
    } else {
      setDiscount(null)
      let rawTax = rawSubtotal * (taxPercentage / 100)
      let roundedTax = Math.round(rawTax * 100) / 100
      setTax(roundedTax);
      let rawTotal = rawSubtotal +  rawTax  + Number(tip)
      let roundedTotal = Math.round(rawTotal * 100) / 100
      setTotal(roundedTotal)
      if(splitDivisor > 0){
        let rawSplitAmount = rawTotal / splitDivisor
        let roundedSplitAmount = Math.round(rawSplitAmount * 100) / 100
        setSplitAmount(roundedSplitAmount)
      }
    }
  }
  }, [taxPercentage, discountPercentage, tip, splitDivisor])


  //Persisting data between refresh
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

  useEffect(() => {
    window.localStorage.setItem('billName', billName)
    window.localStorage.setItem('rowData', JSON.stringify(rowData))
  }, [billName, rowData]);

  useEffect(() => {
    window.localStorage.setItem('discountPercentage', discountPercentage);
    window.localStorage.setItem('taxPercentage', taxPercentage);
    window.localStorage.setItem('tip', tip);
    window.localStorage.setItem('splitDivisor', splitDivisor);

    calculateAll()
  }, [taxPercentage, discountPercentage, tip, splitDivisor, calculateAll])

  const gridRef = useRef()
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%', }), [])

  const clearData = useCallback(() => {
    const rowData = []
    gridRef.current.api.forEachNode(function (node) {
      rowData.push(node.data)
    })
    gridRef.current.api.applyTransaction({
      remove: rowData,
    })
    calculateAll()
    localStorage.clear();
    setBillName('')
    setDiscount(null)
    setDiscountPercentage(0)
    setTax(0)
    setTaxPercentage(0)
    setTip(0)
    setSplitDivisor(1)
    setSplitAmount(null)
  }, [calculateAll])

  const addItem = useCallback((addIndex) => {
    gridRef.current.api.applyTransaction({
      add: [{qty: 1, price: 0}],
      addIndex: addIndex,
    })
  }, [])

  const deselect = useCallback(() => {
    gridRef.current.api.deselectAll();
  }, [])

  const onRemoveSelected = useCallback(() => {
    const selectedData = gridRef.current.api.getSelectedRows()
    gridRef.current.api.applyTransaction({ remove: selectedData })
    calculateAll()
  }, [calculateAll])

  const handleBillNameChange = (event) => {
    setBillName(event.target.value)
  }

  const handleOptionsChange = (event) => {
    setOptions(event.target.checked)
  }

  const handleTaxPercentageChange = (event) => {
    setTaxPercentage(event.target.value)
  }

  const handleDiscountPercentageChange = (event) => {
    setDiscountPercentage(event.target.value)
  }

  const handleTipChange = (event) => {
    if(event.target.value < 0) setTip(0)
    else setTip(event.target.value)
  }

  const handleSplitDivisorChange = (event) => {
    if(event.target.value < 1 && event.target.value.length >= 1) setSplitDivisor(1)
    else setSplitDivisor(event.target.value)
  }

  let splitDivisorText = splitDivisor > 1 ? `Split ${splitDivisor}-ways` : `Split ${splitDivisor}-way`

  return (
    <ThemeProvider theme={theme}>
    <div className='calculator-container'>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <TextField
            id="billName"
            value={billName}
            variant="standard"
            label="Bill Name"
            onChange={handleBillNameChange}
          />
        <div style={{ display: 'flex', marginBottom: '20px', marginTop: '20px', justifyContent: 'space-between' }}>
          <Button variant='outlined' color='primary' onClick={clearData}>Clear Data</Button>
          <Button variant='outlined' color='danger' onClick={onRemoveSelected}>Remove Selected</Button>
        </div>
        <div style={{ flexGrow: '1' }}>
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
      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px'}}>
        <Button sx={{ ml: '2em', mr:'2em', mt: '1em'}} variant='standard' color='neutral' onClick={() => deselect()}>Unselect All</Button>
        <Button sx={{ ml: '2em', mr:'2em', mt: '1em'}} variant='contained' color='primary' startIcon={<AddCircleIcon />} onClick={() => addItem(undefined)}>Add Item</Button>
        {/* <Button variant='contained' color='neutral' onClick={() => getRowData()}>Data</Button> */}
      </div>
      <div style={{display: 'flex', flexDirection:'column', marginLeft: '20px', marginRight: '20px', minWidth: '40px', maxWidth: '140px'}}>
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
            id="splitDivisor"
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
      <div className='calculator-cost-breakdown'>
        <Typography variant='body1'>Subtotal: ${subtotal.toFixed(2)}</Typography>
        {discount && <Typography variant='body1'>Discount: -${discount.toFixed(2)}</Typography>}
        <Typography variant='body1'>Tax: ${tax.toFixed(2)}</Typography>
        <Typography variant='body1'><strong>Total: ${total.toFixed(2)}</strong></Typography>
        {splitAmount > 0 && splitDivisor.length > 0 && <Typography variant='body1'>Split: ${splitAmount.toFixed(2)}</Typography>}
      </div>
    </div>
    </ThemeProvider>
  )
}

export default Calculator