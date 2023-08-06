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
          class="is-capitalized"
          [disabled]="true" />
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
  `,
  styleUrls: ['./city-detail.component.scss'],
})
export class CityDetailComponent {
  route = inject(ActivatedRoute);
  dataService: DataService = inject(DataService);
  cityForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(4)]),
  });
  routeList: Route[] = [];

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

    // this.dataService.getRouteByCityId(cityId).then((routes: Route[]) => {
    //   this.routeList = routes;
    // });
  }

  cityFormOnSubmit() {
    return null;
  }
}
