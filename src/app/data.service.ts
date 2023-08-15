import { Injectable } from '@angular/core';
import {
  City,
  BusRoute,
  Place,
  PlaceTableData,
  RouteStop,
  RouteStopTableData,
  ApiResponse,
} from './types';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  public cityList: City[] = [];

  url = 'http://localhost:3000/api/v1';

  async getAllCities(): Promise<ApiResponse<City[]>> {
    const res = await fetch(`${this.url}/cities`);
    const json = (await res.json()) ?? [];
    this.cityList = [...json];
    return { status: res.status, ok: res.ok, data: json };
  }

  async addNewCity(data: City): Promise<ApiResponse<City>> {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/cities`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async getCityById(id: City['_id']): Promise<ApiResponse<City>> {
    const res = await fetch(`${this.url}/cities/${id}`);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async deleteCityById(id: City['_id']): Promise<ApiResponse<City>> {
    const options = { method: 'DELETE' };
    const res = await fetch(`${this.url}/cities/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async updateCityById(
    id: City['_id'],
    data: City
  ): Promise<ApiResponse<City>> {
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/cities/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async getRoutesByCityId(id: City['_id']): Promise<ApiResponse<BusRoute[]>> {
    const res = await fetch(`${this.url}/cities/${id}/bus-routes`);
    const json = (await res.json()) ?? [];
    return { status: res.status, ok: res.ok, data: json };
  }

  async addNewBusRoute(data: BusRoute): Promise<ApiResponse<BusRoute>> {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/bus-routes`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async deleteBusRouteById(
    id: BusRoute['_id']
  ): Promise<ApiResponse<BusRoute>> {
    const options = { method: 'DELETE' };
    const res = await fetch(`${this.url}/bus-routes/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async updateBusRouteById(
    id: BusRoute['_id'],
    data: BusRoute
  ): Promise<ApiResponse<BusRoute>> {
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/bus-routes/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async getAllBusRoutes(): Promise<ApiResponse<BusRoute[]>> {
    const res = await fetch(`${this.url}/bus-routes`);
    const json = (await res.json()) ?? [];
    return { status: res.status, ok: res.ok, data: json };
  }

  async addNewPlace(data: Place): Promise<ApiResponse<PlaceTableData>> {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/places`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async getAllPlaces(): Promise<ApiResponse<PlaceTableData[]>> {
    const res = await fetch(`${this.url}/places`);
    const json = (await res.json()) ?? [];
    return { status: res.status, ok: res.ok, data: json };
  }

  async deletePlaceById(id: Place['_id']): Promise<ApiResponse<Place>> {
    const options = { method: 'DELETE' };
    const res = await fetch(`${this.url}/places/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async updatePlaceById(
    id: Place['_id'],
    data: Place
  ): Promise<ApiResponse<PlaceTableData>> {
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/places/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async getPlacesByCityId(
    id: City['_id']
  ): Promise<ApiResponse<PlaceTableData[]>> {
    const res = await fetch(`${this.url}/cities/${id}/places`);
    const json = (await res.json()) ?? [];
    return { status: res.status, ok: res.ok, data: json };
  }

  async getRouteStopsByRouteId(
    id: BusRoute['_id']
  ): Promise<ApiResponse<RouteStopTableData[]>> {
    const res = await fetch(`${this.url}/bus-routes/${id}/stops`);
    const json = (await res.json()) ?? [];
    return { status: res.status, ok: res.ok, data: json };
  }

  async getAllRouteStops(): Promise<ApiResponse<RouteStopTableData[]>> {
    const res = await fetch(`${this.url}/route-stops`);
    const json = (await res.json()) ?? [];
    return { status: res.status, ok: res.ok, data: json };
  }

  async addNewRouteStop(
    data: RouteStop
  ): Promise<ApiResponse<RouteStopTableData>> {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/route-stops`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async updateRouteStopById(
    id: RouteStop['_id'],
    data: RouteStop
  ): Promise<ApiResponse<RouteStopTableData>> {
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/route-stops/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async deleteRouteStopById(
    id: RouteStop['_id']
  ): Promise<ApiResponse<RouteStopTableData>> {
    const options = { method: 'DELETE' };
    const res = await fetch(`${this.url}/route-stops/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }
}
