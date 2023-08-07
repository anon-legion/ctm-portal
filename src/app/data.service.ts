import { Injectable } from '@angular/core';
import { City, BusRoute, ApiResponse } from './types';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  public cityList: City[] = [];
  public routeList: BusRoute[] = [];

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

  async getCityById(id: string): Promise<ApiResponse<City>> {
    const res = await fetch(`${this.url}/cities/${id}`);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async deleteCityById(
    id: string
  ): Promise<ApiResponse<City | Record<string, string>>> {
    const options = { method: 'DELETE' };
    const res = await fetch(`${this.url}/cities/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async updateCityById(id: string, data: City): Promise<ApiResponse<City>> {
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/cities/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async getRoutesByCityId(id: string): Promise<ApiResponse<BusRoute[]>> {
    const res = await fetch(`${this.url}/cities/${id}/bus-routes`);
    const json = (await res.json()) ?? [];
    this.routeList = [...json];
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
    id: string
  ): Promise<ApiResponse<BusRoute | Record<string, string>>> {
    const options = { method: 'DELETE' };
    const res = await fetch(`${this.url}/bus-routes/${id}`, options);
    const json = (await res.json()) ?? {};
    return { status: res.status, ok: res.ok, data: json };
  }

  async updateBusRouteById(
    id: string,
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
}
