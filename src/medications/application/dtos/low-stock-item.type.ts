export type LowStockItem = {
  medicationId: string;
  medicationName: string;
  currentQuantity: number;
  projectedQuantity: number;
  willRunOut: boolean;
};
