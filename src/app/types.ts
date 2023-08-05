export interface City {
  _id: string;
  name: string;
  isActive?: boolean;
}

export interface Route {
  id: string;
  cityId: string;
  name: string;
  isActive?: boolean;
}
