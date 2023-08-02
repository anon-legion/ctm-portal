import { Injectable } from '@angular/core';
import { City } from './types';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  url = 'http://localhost:3000/api/v1';

  async getAllCities(): Promise<City[]> {
    const data = await fetch(`${this.url}/cities`);
    return data.json() ?? [];
  }

  async addNewCity(data: City): Promise<{ status: number; data: City }> {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    const res = await fetch(`${this.url}/cities`, options);
    const json = (await res.json()) ?? null;
    return { status: res.status, data: json };
  }
}
