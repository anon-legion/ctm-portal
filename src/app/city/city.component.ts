import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../data.service';
import { City } from '../types';

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatListModule,
    MatDividerModule,
  ],
  template: `
    <form
      class="container is-flex is-flex-direction-column p-1 mb-2 width-breakpoint-768"
      [formGroup]="cityForm"
      (submit)="cityFormOnSubmit()">
      <mat-form-field
        class="city-form-field"
        appearance="outline"
        color="accent">
        <mat-label>City Name</mat-label>
        <input matInput type="text" formControlName="cityName" />
        <button
          *ngIf="cityForm.value.cityName"
          matSuffix
          mat-icon-button
          aria-label="Clear"
          (click)="cityForm.get('cityName')?.setValue('')">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>

      <mat-form-field
        class="city-form-field"
        appearance="outline"
        color="accent">
        <mat-label>City ID</mat-label>
        <input matInput type="text" formControlName="cityId" />
        <button
          *ngIf="cityForm.value.cityId"
          matSuffix
          mat-icon-button
          aria-label="Clear"
          (click)="cityForm.get('cityId')?.setValue('')">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
      <mat-slide-toggle class="mb-3" color="accent" formControlName="isActive">
        {{ cityForm.value.isActive ? 'Active' : 'Disabled' }}
      </mat-slide-toggle>
      <button
        type="submit"
        mat-raised-button
        color="primary"
        [disabled]="!cityForm.valid">
        Add
      </button>
    </form>
    <mat-divider class="container width-breakpoint-768"></mat-divider>
    <mat-list class="container width-breakpoint-768">
      <mat-list-item *ngFor="let city of cityList">
        <a [routerLink]="[city.id]">{{ city.name }}</a>
      </mat-list-item>
    </mat-list>
  `,
  styleUrls: ['./city.component.scss'],
})
export class CityComponent {
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
    });
  }

  cityFormOnSubmit() {
    console.log(this.cityForm.value.cityId || 'n/a');
    console.log(this.cityForm.value.cityName || 'n/a');
    console.log(this.cityForm.value.isActive);
    console.log(this.cityForm.valid);
  }
}
