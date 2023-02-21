import React, { useState, useRef, useMemo, useCallback, useEffect} from 'react'
import { AgGridReact } from 'ag-grid-react' // the AG Grid React Component
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import 'ag-grid-community/styles/ag-grid.css' // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css' // Optional theme CSS
import './Calculator.css'

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    neutral: {
      main: '#555A4D',
    },
    danger: {
      main: '#2E3D34',
    },
  },
});

const printResult = (res) => {
  console.log('---------------------------------------')
  if (res.add) {
    res.add.forEach(function (rowNode) {
      console.log('Added Row Node', rowNode)
    })
  }
  if (res.remove) {
    res.remove.forEach(function (rowNode) {
      console.log('Removed Row Node', rowNode)
    })
  }
  if (res.update) {
    res.update.forEach(function (rowNode) {
      console.log('Updated Row Node', rowNode)
    })
  }
}

const Calculator = () => {
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [discount, setDiscount] = useState(null)

  const [taxPercentage, setTaxPercentage] = useState(0);
  const [tax, setTax] = useState(0)

  const [tip, setTip] = useState(0);

  const [subtotal, setSubtotal] = useState(0)
  const [total, setTotal] = useState(0)

  const calculateAll = useCallback(() => {
    const rowData = []
    if(gridRef.current.api){
    gridRef.current.api.forEachNode(function (node) {
      rowData.push(node.data)
    })
    let rawSubtotal = rowData.reduce((sum, cur) => {
      if(cur.quantity && cur.price)
        return sum + Number((cur.quantity * cur.price))
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
      let rawTotal = (rawSubtotal - rawDiscount) +  rawTax  + Number(tip);
      let roundedTotal = Math.round(rawTotal * 100) / 100
      setTotal(roundedTotal)
    } else {
      setDiscount(null)
      let rawTax = rawSubtotal * (taxPercentage / 100)
      let roundedTax = Math.round(rawTax * 100) / 100
      setTax(roundedTax);
      let rawTotal = rawSubtotal +  rawTax  + Number(tip);
      let roundedTotal = Math.round(rawTotal * 100) / 100
      setTotal(roundedTotal)
    }
  }
  }, [taxPercentage, discountPercentage, tip])

  const gridRef = useRef()
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%', }), [])

  const [rowData] = useState([])
  const [columnDefs] = useState([
    {field: 'quantity', flex: 1, minWidth: 100, editable: true, valueParser: params => Number(params.newValue)},
    {field: 'name', flex: 2, editable: true},
    {field: 'price', flex:2,  editable: true, valueParser: params => Number(params.newValue)}
  ])
  const defaultColDef = useMemo(() => {
    return {
      resizable: true,
    }
  }, [])

  const getRowData = useCallback(() => {
    console.log("Calling get row data")
    const rowData = []
    gridRef.current.api.forEachNode(function (node) {
      rowData.push(node.data)
    })
    console.log('Row Data:')
    console.table(rowData)
  }, [])

  const clearData = useCallback(() => {
    const rowData = []
    gridRef.current.api.forEachNode(function (node) {
      rowData.push(node.data)
    })
    gridRef.current.api.applyTransaction({
      remove: rowData,
    })
    calculateAll()
  }, [calculateAll])

  const addItem = useCallback((addIndex) => {
    gridRef.current.api.applyTransaction({
      add: [{quantity: 1, price: 0}],
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
  }, [])

  const handleTaxPercentageChange = (event) => {
    setTaxPercentage(event.target.value);
  }

  const handleDiscountPercentageChange = (event) => {
    setDiscountPercentage(event.target.value);
  }

  const handleTipChange = (event) => {
    setTip(event.target.value);
  }



  useEffect(() => {
    calculateAll()
  }, [taxPercentage, discountPercentage, tip, calculateAll])

  return (
    <div className='calculator-container'>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', marginBottom: '20px', marginTop: '20px', justifyContent: 'space-between' }}>
        <ThemeProvider theme={theme}>
          <Button variant='outlined' color='danger' onClick={onRemoveSelected}>Remove Selected</Button>
          <Button variant='outlined' color='danger' onClick={clearData}>Clear Data</Button>
        </ThemeProvider>
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
        <ThemeProvider theme={theme}>
          <Button variant='standard' color='neutral' onClick={() => deselect()}>Unselect All</Button>
          <Button variant='standard' color='neutral' startIcon={<AddCircleIcon />} onClick={() => addItem(undefined)}>Add Item</Button>
          {/* <Button variant='contained' color='neutral' onClick={() => getRowData()}>Data</Button> */}
        </ThemeProvider>
      </div>
      <div style={{display: 'flex', flexDirection:'column', marginLeft: '20px', marginRight: '20px', minWidth: '40px', maxWidth: '140px'}}>
        <TextField
          id="discount-percentage"
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
      </div>
      <div className='calculator-cost-breakdown'>
        <Typography variant='body1'>Subtotal: ${subtotal.toFixed(2)}</Typography>
        {discount && <Typography variant='body1'>Discount: -${discount.toFixed(2)}</Typography>}
        <Typography variant='body1'>Tax: ${tax.toFixed(2)}</Typography>
        <Typography variant='body1'><strong>Total: ${total.toFixed(2)}</strong></Typography>
      </div>
    </div>
  )
}

export default Calculator