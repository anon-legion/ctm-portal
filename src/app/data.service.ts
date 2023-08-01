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
}
