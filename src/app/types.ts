export interface City {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface BusRoute extends City {
  cityId: string;
}

export interface Place extends BusRoute {
  aliases: string[];
}

export interface RouteStop {
  _id: string;
  routeId: BusRoute['_id'];
  placeId: Place['_id'];
  distance: number;
  isActive: boolean;
}

export interface PlaceTableData extends City {
  cityId: City;
  aliases: string[];
}

export type ApiResponse<T> = {
  status: number;
  ok: boolean;
  data: T;
};
