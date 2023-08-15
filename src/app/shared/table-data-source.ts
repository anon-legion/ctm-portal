import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject } from 'rxjs';
import { sortObjArrByProp } from './utils';
import { PlaceTableData, RouteStopTableData } from '../types';

class TableDataSource<
  T extends PlaceTableData | RouteStopTableData,
> extends DataSource<T> {
  private _dataStream = new BehaviorSubject<T[]>([]);

  constructor(initialData: T[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<T[]> {
    return this._dataStream;
  }

  disconnect(): void {
    this._dataStream.complete();
  }

  setData(data: T[]) {
    const sortedData = sortObjArrByProp<T>(data, 'name' as keyof T);
    this._dataStream.next(sortedData);
  }

  push(data: T) {
    const sortedData = sortObjArrByProp<T>(
      [...this._dataStream.getValue(), data],
      'name' as keyof T
    );
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

    this._dataStream.next(updatedData);
  }
}

export default TableDataSource;
