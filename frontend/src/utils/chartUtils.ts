export const getLatestTimestamp = (chartData: any[]): string | null => {
  if (!chartData || chartData.length === 0) return null;
  return chartData[chartData.length - 1].timestamp;
};

export const areChartDataEqual = (data1: any[] | undefined, data2: any[] | undefined): boolean => {
  if (!data1 && !data2) return true;
  if (!data1 || !data2) return false;
  if (data1.length !== data2.length) return false;

  for (let i = 0; i < data1.length; i++) {
    if (data1[i].timestamp !== data2[i].timestamp) {
      return false;
    }
  }

  return true;
};

export const shouldSkipUpdate = (
  existingData: any[] | undefined,
  newData: any[] | undefined
): boolean => {
  if (!existingData || !newData) return false;

  const existingLatest = getLatestTimestamp(existingData);
  const newLatest = getLatestTimestamp(newData);

  if (!existingLatest || !newLatest) return false;

  return existingLatest === newLatest && areChartDataEqual(existingData, newData);
};
