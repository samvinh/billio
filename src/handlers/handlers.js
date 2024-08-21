// Handle adding an item to the grid
export const handleAddItem = (gridRef) => () => {
  gridRef.current.api.applyTransaction({
    add: [{ qty: 1, price: 0 }],
    addIndex: undefined,
  });
};

// Handle clearing all data
export const handleClearData = (gridRef, calculateAll, setState) => () => {
  const rowData = [];
  gridRef.current.api.forEachNode((node) => {
    rowData.push(node.data);
  });
  gridRef.current.api.applyTransaction({
    remove: rowData,
  });
  calculateAll();
  localStorage.clear();
  setState({
    billName: "",
    discount: null,
    discountPercentage: 0,
    tax: 0,
    taxPercentage: 0,
    tip: 0,
    splitDivisor: 1,
    splitAmount: null,
  });
};

// Handle deselecting all rows in the grid
export const handleDeselectAll = (gridRef) => () => {
  gridRef.current.api.deselectAll();
};

// Handle removing selected rows from the grid
export const handleRemoveSelected = (gridRef, calculateAll) => () => {
  const selectedData = gridRef.current.api.getSelectedRows();
  gridRef.current.api.applyTransaction({ remove: selectedData });

  // Recalculate totals
  calculateAll();
};
