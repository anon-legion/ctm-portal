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
  constructor() {
    // do nothing
  }
}
