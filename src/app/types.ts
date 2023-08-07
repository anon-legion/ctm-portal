export interface City {
  _id: string;
  name: string;
  isActive?: boolean;
}

export interface BusRoute {
  _id: string;
  cityId: string;
  name: string;
  isActive?: boolean;
}

export type ApiResponse<T> = {
  status: number;
  ok: boolean;
  data: T;
};
