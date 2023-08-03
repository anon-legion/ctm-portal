import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpStatusCode as StatusCode } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { DataService } from '../data.service';
import { City } from '../types';

function sortCityArr(cities: City[]): City[] {
  const ascending = cities.sort((a, b) => a.name.localeCompare(b.name));
  return ascending;
}

function toTitleCase(text: string) {
  return text.toLowerCase().replace(/\b./g, a => a.toUpperCase());
}

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
      [formGroup]="cityForm">
      <mat-form-field appearance="outline" color="accent">
        <mat-label>City Name</mat-label>
        <input
          matInput
          type="text"
          formControlName="name"
          class="is-capitalized" />
        <mat-error *ngIf="cityForm.get('name')?.invalid">
          Name already exists
        </mat-error>
        <button
          *ngIf="cityForm.value.name"
          matSuffix
          mat-icon-button
          aria-label="Clear"
          (click)="cityForm.get('name')?.reset('')">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
      <mat-form-field appearance="outline" color="accent">
        <mat-label>City ID</mat-label>
        <input matInput type="text" formControlName="id" class="is-lowercase" />
        <mat-error *ngIf="cityForm.get('id')?.invalid">
          ID already exists
        </mat-error>
        <button
          *ngIf="cityForm.value.id"
          matSuffix
          mat-icon-button
          aria-label="Clear"
          (click)="cityForm.get('id')?.reset()">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
      <mat-slide-toggle class="mb-2" color="accent" formControlName="isActive">
        {{ cityForm.value.isActive ? 'Active' : 'Inactive' }}
      </mat-slide-toggle>
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
      <!-- <mat-list class="">
        <mat-list-item *ngFor="let city of cityList">
          <a [routerLink]="[city.id]">{{ city.name }}</a>
        </mat-list-item>
      </mat-list> -->
      <mat-selection-list #cities [multiple]="false">
        <mat-list-option *ngFor="let city of cityList" [value]="city.id">
          {{ city.name }}
        </mat-list-option>
      </mat-selection-list>
    </div>
    <div
      class="is-flex is-justify-content-space-around mt-4 width-breakpoint-768">
      <button mat-raised-button color="accent" class="uniform-button">
        Edit
      </button>
      <button mat-raised-button color="warn" class="uniform-button">
        Delete
      </button>
      <button mat-raised-button color="primary" class="uniform-button">
        Add Routes
      </button>
    </div>
  `,
  styleUrls: ['./city.component.scss'],
})
export class CityComponent {
  title = 'CTM Builder';
  dataService: DataService = inject(DataService);
  cityList: City[] = [];
  cityForm = new FormGroup({
    id: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(5),
    ]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    isActive: new FormControl(true, [Validators.required]),
  });

  constructor() {
    this.dataService.getAllCities().then(res => {
      this.cityList = sortCityArr(res);
    });
  }

  cityFormOnSubmit() {
    if (!this.cityForm.value.id || !this.cityForm.value.name) return;

    const formData = {
      id: this.cityForm.value.id.toLowerCase(),
      name: toTitleCase(this.cityForm.value.name),
      isActive: this.cityForm.value.isActive,
    } as City;

    this.dataService.addNewCity(formData).then(res => {
      const { status, data } = res;
      if (status === StatusCode.Conflict) {
        for (const key in data) {
          const control = this.cityForm.get(key);
          if (!data[key as keyof typeof data] || !control) continue;
          control.setErrors({ error: 'duplicate' });
        }
        return;
      }
      if (status === StatusCode.Created) {
        this.cityList.push(data);
        this.cityList = sortCityArr(this.cityList);
        this.cityForm.reset({ isActive: true });
      }
    });
  }
}
