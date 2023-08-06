import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  // Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule, MatListOption } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { DataService } from '../data.service';
import { City, Route } from '../types';

@Component({
  selector: 'app-city-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatListModule,
    MatDividerModule,
  ],
  template: `
    <form
      class="container is-flex is-flex-direction-column p-1 mb-2 width-breakpoint-768"
      [formGroup]="cityForm">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>City Name</mat-label>
        <input
          matInput
          type="text"
          formControlName="name"
          class="is-capitalized" />
      </mat-form-field>
      <button
        type="button"
        mat-raised-button
        color="primary"
        [disabled]="!cityForm.valid"
        (click)="cityFormOnSubmit()">
        Add
      </button>
    </form>
    <mat-divider class="width-breakpoint-768"></mat-divider>
    <div class="list-container mt-2 width-breakpoint-768">
      <mat-selection-list
        #busRoutes
        [multiple]="false"
        (selectionChange)="
          selectionOnChange(busRoutes.selectedOptions.selected)
        ">
        <mat-list-option
          *ngFor="let city of routeList"
          [value]="city._id"
          [selected]="">
          {{ city.name }}
        </mat-list-option>
      </mat-selection-list>
    </div>
    <div
      class="is-flex is-justify-content-space-around mt-4 width-breakpoint-768">
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        (click)="editOnClick(selectedBusRoute)">
        Edit
      </button>
      <button
        mat-raised-button
        color="warn"
        class="uniform-button"
        (click)="deleteOnClick(selectedBusRoute)">
        Delete
      </button>
      <button
        mat-raised-button
        color="accent"
        class="uniform-button"
        (click)="navigateTo(selectedBusRoute)">
        Add Stops
      </button>
    </div>
  `,
  styleUrls: ['./city-detail.component.scss'],
})
export class CityDetailComponent {
  route = inject(ActivatedRoute);
  dataService: DataService = inject(DataService);
  cityForm = new FormGroup({
    name: new FormControl({ value: '', disabled: true }),
  });
  routeList: Route[] = [];
  selectedBusRoute = '';

  constructor() {
    const cityId = this.route.snapshot.params['id'];
    this.dataService.getCityById(cityId).then(res => {
      if (res.ok) {
        const city = res.data as City;
        this.cityForm.setValue({
          name: city.name,
        });
      }
    });

    this.dataService.getRouteByCityId(cityId).then(res => {
      console.log(res);
      if (res.ok) {
        this.routeList = res.data as Route[];
      }
    });
  }

  cityFormOnSubmit() {
    return null;
  }

  selectionOnChange(selectedOptions: MatListOption[]) {
    const [selectedOption] = selectedOptions;
    this.selectedBusRoute = selectedOption.value;
  }

  editOnClick(selectedCity: string) {
    console.log(selectedCity);
  }

  deleteOnClick(selectedCity: string) {
    console.log(selectedCity);
  }

  navigateTo(selectedCity: string) {
    console.log(selectedCity);
  }
}
