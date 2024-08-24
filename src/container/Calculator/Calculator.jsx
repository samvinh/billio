import React, { useState, useRef, useCallback, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import TuneIcon from "@mui/icons-material/Tune";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { format } from "date-fns";
import { isMobile } from "react-device-detect";

import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional theme CSS
import "./Calculator.css";

import { ThemeProvider } from "@mui/material/styles";
import theme from "../../themes/themes";
import { defaultColDef, gridStyle, columnDefs } from "../../config/gridConfig";
import {
  handleAddItem,
  handleClearData,
  handleDeselectAll,
  handleRemoveSelected,
} from "../../handlers/handlers";

import {
  getRowData,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  calculateTotal,
  calculateSplitAmount,
  calculatePercentageTip,
} from "../../utils/calculatorUtils";

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts"; // or from the specific path you use

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const Calculator = () => {
  const handleExportPDF = () => {
    const {
      subtotal,
      discount,
      tax,
      tip,
      total,
      tipType,
      rowData,
      billName,
      contributors,
    } = state;

    const now = new Date();
    const formattedDate = format(now, "yyyy-MM-dd_HH-mm-ss");
    const cleanBillName = billName.replace(/[<>:"/\\|?*]/g, "-");
    const pdfFilename = `Bill_${cleanBillName}_${formattedDate}.pdf`;
    const exportDate = format(now, "yyyy-MM-dd HH:mm:ss");

    const docDefinition = {
      content: [
        { text: "BILL SUMMARY", style: "header" },
        { text: exportDate, alignment: "right", margin: [0, 0, 0, 10] },

        {
          columns: [
            {
              text: [
                { text: "From:\n", style: "subheader" },
                `${cleanBillName}\n`,
                "\n",
                "\n",
                "\n",
              ],
            },
            {
              text: [
                { text: "To:\n", style: "subheader" },
                `${contributors}`,
                "\n",
                "\n",
                "\n",
              ],
              alignment: "right",
            },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 },
          ],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: [
              [
                { text: "Item", style: "tableHeader" },
                { text: "Unit Price", style: "tableHeader" },
                { text: "Quantity", style: "tableHeader" },
                { text: "Item Total", style: "tableHeader" },
              ],
              ...rowData.map((item) => {
                const itemName = item.name
                  ? item.name.toString()
                  : "Unknown Item";
                const unitPrice = !isNaN(item.price)
                  ? `$${parseFloat(item.price).toFixed(2)}`
                  : "$0.00";
                const quantity = !isNaN(item.qty)
                  ? parseFloat(item.qty).toFixed(0)
                  : "0";
                const itemTotal = !isNaN(item.price * item.qty)
                  ? `$${(item.price * item.qty).toFixed(2)}`
                  : "$0.00";
                return [itemName, unitPrice, quantity, itemTotal];
              }),
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 10, 0, 20],
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 },
          ],
        },
        {
          columns: [
            { width: "*", text: "" },
            {
              width: "auto",
              table: {
                body: [
                  ["Subtotal", `$${subtotal.toFixed(2)}`],
                  [
                    "Discount",
                    discount > 0
                      ? `-$${discount.toFixed(2)}`
                      : `$${discount.toFixed(2)}`,
                  ],
                  [
                    "Discounted Subtotal",
                    `$${(subtotal - discount).toFixed(2)}`,
                  ],
                  ["Tax", `$${tax.toFixed(2)}`],
                  [
                    "Tip",
                    tipType === "percentage"
                      ? `$${calculatePercentageTip(subtotal, tip).toFixed(
                          2
                        )} (${tip.toFixed(2)}%)`
                      : `$${tip.toFixed(2)}`,
                  ],
                  [
                    { text: "Total", bold: true },
                    { text: `$${total.toFixed(2)}`, bold: true },
                  ],
                ],
              },
              layout: "noBorders",
            },
          ],
          margin: [0, 10, 0, 0],
        },
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          bold: true,
          margin: [0, 5, 0, 5],
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: "black",
        },
      },
    };

    pdfMake.createPdf(docDefinition).download(pdfFilename);
  };

  const [showHelpText, setShowHelpText] = useState(false);

  const toggleHelpText = () => {
    setShowHelpText((prev) => !prev);
  };

  const [state, setState] = useState({
    billName: "",
    contributors: "",
    options: false,
    splitDivisor: 1,
    splitAmount: 0,
    discountPercentage: 0,
    discount: 0,
    taxPercentage: 0,
    tax: 0,
    tip: 0,
    tipType: "absolute", // or 'percentage'
    subtotal: 0,
    total: 0,
    rowData: [],
  });

  const gridRef = useRef();

  const calculateAll = useCallback(() => {
    if (!gridRef.current) return;

    const api = gridRef.current.api;
    const rowData = getRowData(api);
    const subtotal = calculateSubtotal(rowData);
    const discount = calculateDiscount(subtotal, state.discountPercentage);
    const tax = calculateTax(subtotal, discount, state.taxPercentage);

    let tip = 0;
    if (state.tipType === "percentage") {
      tip = subtotal * (state.tip / 100);
    } else {
      tip = state.tip;
    }

    const total = calculateTotal(subtotal, discount, tax, tip);
    const splitAmount = calculateSplitAmount(total, state.splitDivisor);

    setState((prevState) => ({
      ...prevState,
      rowData,
      subtotal,
      discount,
      tax,
      total,
      splitAmount,
    }));

    window.localStorage.setItem("rowData", JSON.stringify(rowData));
  }, [
    state.discountPercentage,
    state.taxPercentage,
    state.tip,
    state.tipType,
    state.splitDivisor,
  ]);

  useEffect(() => {
    const billName = window.localStorage.getItem("billName") || "";
    const contributors = window.localStorage.getItem("contributors") || "";
    const rowData = JSON.parse(window.localStorage.getItem("rowData") || "[]");
    const discountPercentage = parseFloat(
      window.localStorage.getItem("discountPercentage") || "0"
    );
    const taxPercentage = parseFloat(
      window.localStorage.getItem("taxPercentage") || "0"
    );
    const tip = parseFloat(window.localStorage.getItem("tip") || "0");
    const splitDivisor = parseInt(
      window.localStorage.getItem("splitDivisor") || "1",
      10
    );
    const tipType = window.localStorage.getItem("tipType") || "absolute";

    setState((prevState) => ({
      ...prevState,
      billName,
      contributors,
      rowData,
      discountPercentage,
      taxPercentage,
      tip,
      splitDivisor,
      tipType,
    }));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("billName", state.billName);
    window.localStorage.setItem("contributors", state.contributors);
    window.localStorage.setItem("rowData", JSON.stringify(state.rowData));
  }, [state.billName, state.contributors, state.rowData]);

  useEffect(() => {
    window.localStorage.setItem("tipType", state.tipType);
    window.localStorage.setItem("discountPercentage", state.discountPercentage);
    window.localStorage.setItem("taxPercentage", state.taxPercentage);
    window.localStorage.setItem("tip", state.tip);
    window.localStorage.setItem("splitDivisor", state.splitDivisor);

    if (state.rowData.length > 0) {
      calculateAll();
    }
  }, [
    state.rowData.length,
    state.taxPercentage,
    state.discountPercentage,
    state.tip,
    state.tipType,
    state.splitDivisor,
    calculateAll,
  ]);

  const handleBillNameChange = (e) =>
    setState((prevState) => ({ ...prevState, billName: e.target.value }));

  const handleContributorsChange = (e) =>
    setState((prevState) => ({ ...prevState, contributors: e.target.value }));

  const handleToggleOptions = () =>
    setState((prevState) => ({ ...prevState, options: !prevState.options }));

  const handleTaxPercentageChange = (e) =>
    setState((prevState) => ({
      ...prevState,
      taxPercentage: parseFloat(e.target.value),
    }));

  const handleDiscountPercentageChange = (e) =>
    setState((prevState) => ({
      ...prevState,
      discountPercentage: parseFloat(e.target.value),
    }));

  const handleTipChange = (e) =>
    setState((prevState) => ({
      ...prevState,
      tip: parseFloat(e.target.value),
    }));

  const handleSplitDivisorChange = (e) =>
    setState((prevState) => ({
      ...prevState,
      splitDivisor: parseInt(e.target.value, 10),
    }));

  const addItem = handleAddItem(gridRef);
  const clearData = handleClearData(gridRef, calculateAll, (newState) => {
    setState((prevState) => ({
      ...prevState,
      billName: newState.billName,
      contributors: newState.contributors,
      discount: newState.discount,
      discountPercentage: newState.discountPercentage,
      tax: newState.tax,
      taxPercentage: newState.taxPercentage,
      tip: newState.tip,
      splitDivisor: newState.splitDivisor,
      splitAmount: newState.splitAmount,
    }));
  });
  const deselect = handleDeselectAll(gridRef);

  const onRemoveSelected = handleRemoveSelected(gridRef, calculateAll);

  const onCellEditingStopped = () => {
    calculateAll();
  };

  const singleClickEdit = isMobile;

  const splitDivisorText =
    state.splitDivisor > 1
      ? `Split ${state.splitDivisor}-ways`
      : `Split ${state.splitDivisor}-way`;

  return (
    <ThemeProvider theme={theme}>
      <div className="calculator-container">
        <div className="bill-header">
          <TextField
            id="billName"
            value={state.billName}
            variant="standard"
            label="Bill Name"
            onChange={handleBillNameChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            sx={{
              "& .MuiInputLabel-root": {
                fontSize: "1rem",
              },
              "& .MuiInputBase-input": {
                fontSize: "1rem",
              },
            }}
          />
          <TextField
            id="contributors"
            value={state.contributors}
            variant="outlined"
            label="Contributors"
            onChange={handleContributorsChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            sx={{
              "& .MuiInputLabel-root": {
                fontSize: "1rem",
              },
              "& .MuiInputBase-input": {
                fontSize: "1rem",
              },
            }}
          />
        </div>
        <div className="top-button-group">
          <Button
            variant="outlined"
            color="danger"
            startIcon={<ClearIcon />}
            onClick={clearData}
          >
            Clear All
          </Button>
          <Button
            variant="outlined"
            color="danger"
            startIcon={<DeleteIcon />}
            onClick={onRemoveSelected}
          >
            Selected
          </Button>
        </div>
        <div className="flex-grow">
          <div style={gridStyle} className="ag-theme-alpine">
            <AgGridReact
              ref={gridRef}
              rowData={state.rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              domLayout={"autoHeight"}
              rowSelection="multiple"
              animateRows={true}
              stopEditingWhenCellsLoseFocus={true}
              onCellEditingStopped={onCellEditingStopped}
              singleClickEdit={singleClickEdit}
            ></AgGridReact>
          </div>
        </div>
        <div className="bottom-button-group">
          <Button
            sx={{ ml: "2em", mr: "2em", mt: "1em" }}
            variant="standard"
            color="neutral"
            onClick={() => deselect()}
          >
            Unselect All
          </Button>
          <Button
            sx={{ ml: "2em", mr: "2em", mt: "1em" }}
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => addItem(undefined)}
          >
            Row
          </Button>
        </div>
        <div className="options-results-container">
          <div className="options-container">
            <Button
              onClick={handleToggleOptions}
              startIcon={<TuneIcon />}
              endIcon={state.options ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              Options
            </Button>
            <Collapse in={state.options}>
              <div>
                <TextField
                  id="discount-percentage"
                  value={state.discountPercentage}
                  type="number"
                  variant="standard"
                  label="Discount percent"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                  inputProps={{
                    min: 0,
                    step: "1",
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
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                  inputProps={{
                    min: 0,
                    step: "1",
                  }}
                  onChange={handleTaxPercentageChange}
                />
                <div className="tip-percentage">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={state.tipType === "percentage"}
                        onChange={(e) =>
                          setState((prevState) => ({
                            ...prevState,
                            tipType: e.target.checked
                              ? "percentage"
                              : "absolute",
                          }))
                        }
                        name="tipToggle"
                        color="primary"
                      />
                    }
                    label={state.tipType === "percentage" ? "Tip %" : "Tip $"}
                    labelPlacement="start"
                    sx={{ ml: "0px" }}
                  />
                  <TextField
                    id="tip"
                    value={state.tip}
                    type="number"
                    variant="standard"
                    label="Tip"
                    inputProps={{
                      min: 0,
                      step: "1",
                    }}
                    onChange={handleTipChange}
                  />
                </div>
                <TextField
                  id="split-divisor"
                  value={state.splitDivisor}
                  type="number"
                  variant="standard"
                  label="Split amount"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {splitDivisorText}
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    min: 1,
                    step: "1",
                  }}
                  onChange={handleSplitDivisorChange}
                />
              </div>
            </Collapse>
          </div>
          <div className="calculator-cost-breakdown">
            <Typography>Subtotal: ${state.subtotal.toFixed(2)}</Typography>
            {state.discount > 0 && (
              <Typography variant="body1">
                Discount: -${state.discount.toFixed(2)}
              </Typography>
            )}
            {state.discount > 0 && (
              <Typography>
                Discounted Subtotal: $
                {(state.subtotal - state.discount).toFixed(2)}
              </Typography>
            )}
            <Typography>Tax: ${state.tax.toFixed(2)}</Typography>
            <div>
              {state.tipType === "percentage" ? (
                <Typography variant="body1">
                  Tip: $
                  {calculatePercentageTip(state.subtotal, state.tip).toFixed(2)}{" "}
                  ({state.tip.toFixed(2)}%)
                </Typography>
              ) : (
                <Typography variant="body1">
                  Tip: ${state.tip.toFixed(2)}
                </Typography>
              )}
            </div>
            <Typography>Total: ${state.total.toFixed(2)}</Typography>
            {state.splitDivisor > 1 && (
              <Typography>
                Split {state.splitDivisor}-ways: ${state.splitAmount.toFixed(2)}
              </Typography>
            )}
            <div>
              <IconButton color="primary" onClick={toggleHelpText}>
                <LightbulbIcon />
              </IconButton>
              {showHelpText && (
                <Typography variant="body2" style={{ marginTop: "8px" }}>
                  The tip is applied to the subtotal before tax and excludes
                  discounts.
                </Typography>
              )}
            </div>
          </div>
        </div>
        <div className="export-button-container">
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Calculator;
