import { Component, inject } from '@angular/core';
import { DataService } from './data.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { City } from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'CTM Builder';
  dataService: DataService = inject(DataService);
  cityList: City[] = [];
  cityForm = new FormGroup({
    cityId: new FormControl('', [Validators.required, Validators.minLength(4)]),
    cityName: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(5),
    ]),
    isActive: new FormControl(true, [Validators.required]),
  });

  constructor() {
    this.dataService.getAllCities().then(res => {
      this.cityList = res;
      console.log(this.cityList);
    });
  }

  cityFormOnSubmit() {
    console.log(this.cityForm.value.cityId || 'n/a');
    console.log(this.cityForm.value.cityName || 'n/a');
    console.log(this.cityForm.value.isActive);
    console.log(this.cityForm.valid);
  }
}
