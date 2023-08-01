import { Component, inject } from '@angular/core';
import { DataService } from './data.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  dataService: DataService = inject(DataService);
  title = 'CTM Builder';
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
      console.log(res);
    });
  }

  cityFormOnSubmit() {
    console.log(this.cityForm.value.cityId || 'n/a');
    console.log(this.cityForm.value.cityName || 'n/a');
    console.log(this.cityForm.value.isActive);
    console.log(this.cityForm.valid);
  }
}
