import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject } from 'rxjs';
import { sortObjArrByProp } from './utils';
import { PlaceTd, RouteStopTd, BusRoute, City } from '../types';

class TableDataSource<
  T extends PlaceTd | RouteStopTd | BusRoute | City,
> extends DataSource<T> {
  private _dataStream = new BehaviorSubject<T[]>([]);
  private _sort(data: Array<T>) {
    if (!data.length) return [];
    const dataKeys = Object.keys(data[0]);
    return sortObjArrByProp<T>(
      data,
      dataKeys.includes('distance')
        ? ('distance' as keyof T)
        : ('name' as keyof T)
    );
  }

  constructor(initialData: T[]) {
    super();
    this.setData(initialData);
  }

  get value() {
    return this._dataStream.getValue();
  }

  get length() {
    return this._dataStream.getValue().length;
  }

  connect(): Observable<T[]> {
    return this._dataStream;
  }

  disconnect(): void {
    this._dataStream.complete();
  }

  setData(data: T[]) {
    const sortedData = this._sort(data);
    this._dataStream.next(sortedData);
  }

  push(data: T) {
    const sortedData = this._sort([...this._dataStream.getValue(), data]);
    this._dataStream.next(sortedData);
  }

  findById(id: T['_id']) {
    return this._dataStream.getValue().find(place => place._id === id);
  }

  removeById(id: T['_id']) {
    const filteredData = this._dataStream
      .getValue()
      .filter(place => place._id !== id);
    this._dataStream.next(filteredData);
  }

  updateById(id: T['_id'], data: T) {
    const updatedData = this._dataStream
      .getValue()
      .map(el => (el._id === id ? data : el));

    if (!updatedData.some(el => el._id === id)) updatedData.push(data);

    const sortedData = this._sort(updatedData);
    this._dataStream.next(sortedData);
  }
}

export default TableDataSource;
