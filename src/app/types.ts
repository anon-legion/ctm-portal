export interface City {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface BusRoute extends City {
  cityId: string | City;
}

export interface Place extends BusRoute {
  aliases: string[] | [];
}

export interface PlaceTableData extends Place {
  cityId: City;
}

export interface RouteStop {
  _id: string;
  routeId: BusRoute['_id'];
  placeId: Place['_id'] | Place;
  distance: number;
  isActive: boolean;
}

export interface RouteStopTableData extends RouteStop {
  placeId: Place;
}

export type ApiResponse<T> = {
  status: number;
  ok: boolean;
  data: T;
};
