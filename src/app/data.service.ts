import { Injectable } from '@angular/core';
import { City, Route } from './types';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  url = 'http://localhost:3000/api/v1';

  async getAllCities(): Promise<{ status: number; ok: boolean; data: City[] }> {
    const res = await fetch(`${this.url}/cities`);
    const json = (await res.json()) ?? [];
    return { status: res.status, ok: res.ok, data: json };
  }

  async addNewCity(
    data: City
  ): Promise<{ status: number; ok: boolean; data: City }> {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/cities`, options);
    const json = (await res.json()) ?? null;
    return { status: res.status, ok: res.ok, data: json };
  }

  async getCityById(
    id: string
  ): Promise<{ status: number; ok: boolean; data: City }> {
    const res = await fetch(`${this.url}/cities/${id}`);
    const json = (await res.json()) ?? null;
    return { status: res.status, ok: res.ok, data: json };
  }

  async getRouteByCityId(
    id: string
  ): Promise<{ status: number; ok: boolean; data: Route[] }> {
    const res = await fetch(`${this.url}/cities/${id}/bus-routes`);
    const json = (await res.json()) ?? [];
    return { status: res.status, ok: res.ok, data: json };
  }

  async deleteCityById(
    id: string
  ): Promise<{ status: number; ok: boolean; data: Record<string, string> }> {
    const options = { method: 'DELETE' };
    const res = await fetch(`${this.url}/cities/${id}`, options);
    const json = (await res.json()) ?? null;
    return { status: res.status, ok: res.ok, data: json };
  }

  async updateCityById(
    id: string,
    data: City
  ): Promise<{ status: number; ok: boolean; data: City }> {
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/cities/${id}`, options);
    const json = (await res.json()) ?? null;
    return { status: res.status, ok: res.ok, data: json };
  }
}
