export const columnDefs = [
  {field: 'qty', flex: 1, editable: true, valueParser: params => Number(params.newValue)},
  {field: 'name', flex: 3, editable: true, wrapText: true, autoHeight: true, resizable: true},
  {field: 'price', flex: 1, editable: true, valueParser: params => Number(params.newValue)}
];