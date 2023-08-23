import { HttpStatusCode as StatusCode } from '@angular/common/http';
import { DataService } from '../data.service';
import TableDataSource from '../shared/table-data-source';
import { PlaceTd, BusRoute } from '../types';

function getAllData<T extends PlaceTd | BusRoute>(
  service: DataService,
  placeList: TableDataSource<T>,
  type: 'place' | 'busRoute'
) {
  if (type === 'place') {
    service.getAllPlaces().then(res => {
      if (res.status !== StatusCode.Ok || !res.data.length) {
        placeList.setData([]);
        return;
      }
      placeList.setData(res.data as T[]);
    });
  }

  if (type === 'busRoute') {
    service.getAllBusRoutes().then(res => {
      if (res.status !== StatusCode.Ok || !res.data.length) {
        placeList.setData([]);
        return;
      }
      placeList.setData(res.data as T[]);
    });
  }
}

export default getAllData;
