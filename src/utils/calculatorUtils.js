// src/utils/calculatorUtils.js

export const getRowData = (api) => {
  const rowData = [];
  api.forEachNode((node) => rowData.push(node.data));
  return rowData;
};

export const calculateSubtotal = (rowData) => {
  return rowData.reduce(
    (sum, { qty, price }) => (qty && price ? sum + qty * price : sum),
    0
  );
};

export const calculateDiscount = (subtotal, discountPercentage) => {
  return discountPercentage > 0
    ? Math.round(subtotal * (discountPercentage / 100) * 100) / 100
    : 0;
};

export const calculateTax = (subtotal, discount, taxPercentage) => {
  const taxableAmount = subtotal - discount;
  return Math.round(taxableAmount * (taxPercentage / 100) * 100) / 100;
};

export const calculateTotal = (subtotal, discount, tax, tip) => {
  return Math.round((subtotal - discount + tax + Number(tip)) * 100) / 100;
};

export const calculateSplitAmount = (total, splitDivisor) => {
  return splitDivisor > 0 ? Math.round((total / splitDivisor) * 100) / 100 : 0;
};

export const calculatePercentageTip = (subtotal, tipPercentage) => {
  return subtotal * (tipPercentage / 100);
};
