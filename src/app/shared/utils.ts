import { City, BusRoute, Place, PlaceTd, RouteStopTd } from '../types';

export function sortObjArrByProp<
  T extends City | BusRoute | Place | PlaceTd | RouteStopTd,
>(arr: Array<T>, prop: keyof T) {
  const ascending = arr.sort((a, b) => {
    if (a[prop] < b[prop]) return -1;
    if (a[prop] > b[prop]) return 1;
    return 0;
  });
  return ascending;
}

export function toTitleCase(text: string) {
  return text
    .toLowerCase()
    .replace(/\d+[A-Za-z]|\b[a-z]/g, a => a.toUpperCase());
}
