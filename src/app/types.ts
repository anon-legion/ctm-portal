export interface City {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface BusRoute extends City {
  cityId: string;
}

export interface Place extends BusRoute {
  alias: string[];
}

export type ApiResponse<T> = {
  status: number;
  ok: boolean;
  data: T;
};
