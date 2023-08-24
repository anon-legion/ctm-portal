interface BaseModel {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface City extends BaseModel {
  code?: string;
  center?: [number, number] | null;
  zoom?: number | null;
}

export interface BusRoute extends BaseModel {
  cityId: City['_id'] | City;
  weight?: number;
  isSymmetric?: boolean;
  hasPath?: boolean;
}

export interface Place extends BaseModel {
  cityId: City['_id'] | City;
  aliases: string[] | [];
  type?: string | null;
  coords?: [number, number] | null;
}

export interface PlaceTd extends Place {
  cityId: City;
}

export interface RouteStop {
  _id: string;
  routeId: BusRoute['_id'];
  placeId: Place['_id'] | PlaceTd;
  distance: number;
  isActive: boolean;
}

export interface RouteStopTd extends RouteStop {
  placeId: PlaceTd;
}

export type ApiResponse<T> = {
  status: number;
  ok: boolean;
  data: T;
};
