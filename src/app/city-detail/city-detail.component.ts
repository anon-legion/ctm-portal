import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
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
        Update
      </button>
    </form>
    <mat-divider class="width-breakpoint-768"></mat-divider>
    <div class="list-container mt-2 width-breakpoint-768">
      <mat-selection-list #busRoutes [multiple]="false">
        <mat-list-option *ngFor="let route of routeList" [value]="route.id">
          {{ route.name }}
        </mat-list-option>
      </mat-selection-list>
      <button mat-raised-button>Edit</button>
      <button mat-raised-button>Delete</button>
      <button mat-raised-button>Add Routes</button>
    </div>
  `,
  styleUrls: ['./city-detail.component.scss'],
})
export class CityDetailComponent {
  route = inject(ActivatedRoute);
  dataService: DataService = inject(DataService);
  cityForm = new FormGroup({
    id: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(5),
    ]),
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
    isActive: new FormControl(true, [Validators.required]),
  });
  routeList: Route[] = [];

  constructor() {
    const cityId = this.route.snapshot.params['id'];
    this.dataService.getCityById(cityId).then((city: City) => {
      this.cityForm.setValue({
        id: city._id,
        name: city.name,
        isActive: city.isActive ?? true,
      });
    });

    this.dataService.getRouteByCityId(cityId).then((routes: Route[]) => {
      this.routeList = routes;
    });
  }

  cityFormOnSubmit() {
    return null;
  }
}
