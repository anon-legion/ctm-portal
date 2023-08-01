import { Component, inject } from '@angular/core';
import { DataService } from './data.service';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  dataService: DataService = inject(DataService);
  title = 'CTM Builder';
  cityName = '';
  cityId = '';
  isCityActive = true;
  cityForm = new FormGroup({
    cityId: new FormControl(''),
    cityName: new FormControl(''),
    isActive: new FormControl(true),
  });

  constructor() {
    this.dataService.getAllCities().then(res => {
      console.log(res);
    });
  }
}
