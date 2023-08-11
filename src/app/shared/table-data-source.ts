import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject } from 'rxjs';
import { sortObjArrByProp } from './utils';
import { PlaceTableData } from '../types';

class TableDataSource extends DataSource<PlaceTableData> {
  private _dataStream = new BehaviorSubject<PlaceTableData[]>([]);

  constructor(initialData: PlaceTableData[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<PlaceTableData[]> {
    return this._dataStream;
  }

  disconnect(): void {
    this._dataStream.complete();
  }

  setData(data: PlaceTableData[]) {
    const sortedData = sortObjArrByProp<PlaceTableData>(data, 'name');
    this._dataStream.next(sortedData);
  }

  push(data: PlaceTableData) {
    const sortedData = sortObjArrByProp<PlaceTableData>(
      [...this._dataStream.getValue(), data],
      'name'
    );
    this._dataStream.next(sortedData);
  }

  findById(id: PlaceTableData['_id']) {
    return this._dataStream.getValue().find(place => place._id === id);
  }

  removeById(id: PlaceTableData['_id']) {
    const filteredData = this._dataStream
      .getValue()
      .filter(place => place._id !== id);
    this._dataStream.next(filteredData);
  }

  updateById(id: PlaceTableData['_id'], data: PlaceTableData) {
    const updatedData = this._dataStream
      .getValue()
      .map(place => (place._id === id ? data : place));
    this._dataStream.next(updatedData);
  }
}

export default TableDataSource;
