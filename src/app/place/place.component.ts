import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../data.service';
import { Place, City, PlaceTableData } from '../types';
import { toTitleCase } from '../shared/utils';
import { Subscription } from 'rxjs';
import TableDataSource from '../shared/table-data-source';

function getAllPlaces(service: DataService, placeList: TableDataSource) {
  service.getAllPlaces().then(res => {
    if (res.status !== StatusCode.Ok || !res.data.length) {
      placeList.setData([]);
      return;
    }
    placeList.setData(res.data);
  });
}

@Component({
  selector: 'app-place',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTableModule,
  ],
  templateUrl: './place.component.html',
  styleUrls: ['./place.component.scss'],
})
export class PlaceComponent implements OnInit, OnDestroy {
  private _sub: Subscription = new Subscription();
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ]);
  aliasControl = new FormControl([] as string[]);
  isActiveControl = new FormControl(true, [Validators.required]);
  placeForm = new FormGroup({
    name: this.nameControl,
    aliases: this.aliasControl,
    isActive: this.isActiveControl,
  });
  placeList = new TableDataSource([]);
  selectedPlace: Place['_id'] = '';
  selectedCity = {} as City;
  isEditMode = false;
  allCity: City = {
    _id: 'all',
    name: 'all places',
    isActive: true,
  };
  displayedColumns = ['name', 'cityId', 'isActive'];

  constructor(
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _route: ActivatedRoute,
    public dataService: DataService
  ) {
    const cityId = this._route.snapshot.queryParamMap.get('cityId');

    if (!cityId) {
      this.selectedCity = this.allCity;
      this.dataService.getAllCities();
      return;
    }

    this.dataService.getAllCities().then(res => {
      const cityList = res.data as City[];
      const currentCity = cityList.find(city => city._id === cityId);

      // if cityId is not valid, set allCity and get all places
      if (!currentCity) {
        this.selectedCity = this.allCity;
        this._router.navigate([], {
          relativeTo: this._route,
        });
        return;
      }

      this.selectedCity = currentCity;
    });
  }

  get cityList() {
    return this.dataService.cityList;
  }

  placeFormOnSubmit() {
    if (!this.placeForm.value.name) return;
    if (this.selectedCity === this.allCity) {
      this._snackBar.open('Please select a city', 'Close', { duration: 3000 });
      return;
    }

    const control = this.placeForm.get('name');
    const formData = {
      cityId: this.selectedCity._id,
      name: toTitleCase(this.placeForm.value.name),
      aliases: this.placeForm.value.aliases,
      isActive: this.placeForm.value.isActive,
    } as Place;

    // update place
    if (this.isEditMode) {
      this.dataService
        .updatePlaceById(this.selectedPlace, formData)
        .then(res => {
          const { status, data } = res;
          if (status === StatusCode.NotFound) return;
          if (status === StatusCode.Conflict && control) {
            control.setErrors({ error: 'duplicate' });
            this._snackBar.open('Name already exists', 'Close', {
              duration: 3000,
            });
            return;
          }
          if (status === StatusCode.Ok) {
            this._snackBar.open('Update success', 'Close', { duration: 3000 });
            this.placeList.updateById(data._id, data);
            this.placeForm.reset({ isActive: true });
            this.isEditMode = false;
            this.selectedPlace = '';
          }
        });
      return;
    }

    // add new place
    this.dataService.addNewPlace(formData).then(res => {
      const { status, data } = res;
      if (status === StatusCode.Conflict && control) {
        control.setErrors({ error: 'duplicate' });
        this._snackBar.open('Name already exists', 'Close', {
          duration: 3000,
        });
        return;
      }
      if (status === StatusCode.Created) {
        this._snackBar.open('Success', 'Close', {
          duration: 3000,
        });
        this.placeList.push(data);
        this.placeForm.reset({ isActive: true });
        return;
      }
      this._snackBar.open('Something went wrong', 'Close', { duration: 3000 });
    });
  }

  deleteOnClick(placeId: string) {
    this.dataService.deletePlaceById(placeId).then(res => {
      const { status } = res;
      if (status === StatusCode.Ok) {
        this.placeList.removeById(placeId);
        this._snackBar.open('Deleted', 'Close', {
          duration: 3000,
        });
        this.selectedPlace = '';
        this.isEditMode = false;
        this.placeForm.reset({ isActive: true });
      }
    });
  }

  navigateTo(placeId: string) {
    console.log(placeId);
  }

  selectCityOnChange(e: MatSelectChange) {
    if (e.value === this.allCity) {
      // set path to /place
      this._router.navigate([], {
        relativeTo: this._route,
      });
      return;
    }

    const city = e.value as City;

    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { cityId: city._id },
      queryParamsHandling: 'merge',
    });
  }

  removeKeyword(alias: string) {
    const index = this.aliasControl.value?.indexOf(alias);

    if (index !== undefined && index >= 0) {
      this.aliasControl.value?.splice(index, 1);
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim().toUpperCase();
    const flattenedValue = value.replace(/[^a-zA-Z0-9]/g, '');
    const filteredAlias = this.aliasControl.value?.filter(
      alias =>
        alias.toUpperCase().replace(/[^a-zA-Z0-9]/g, '') !== flattenedValue
    );

    // add alias
    if (value && filteredAlias) {
      filteredAlias?.push(value);
      this.aliasControl.setValue(filteredAlias);
    }

    // clear the input value
    event.chipInput.clear();
  }

  rowOnClick(row: PlaceTableData) {
    if (row._id === this.selectedPlace) {
      this.selectedPlace = '';
      this.isEditMode = false;
      this.placeForm.reset({ isActive: true });
      return;
    }

    const cityId = this._route.snapshot.queryParamMap.get('cityId');
    const placeCity = this.cityList.find(city => city._id === row.cityId._id);

    if (!placeCity) return;

    if (cityId !== placeCity?._id) {
      this._router.navigate([], {
        queryParams: { cityId: placeCity?._id },
      });
    }

    this.isEditMode = true;
    this.selectedCity = placeCity;
    this.selectedPlace = row._id;
    this.placeForm.setValue({
      name: row.name,
      aliases: row.aliases ?? [],
      isActive: row.isActive ?? true,
    });
  }

  ngOnInit() {
    // handles updating placeList when cityId changes
    this._sub = this._route.queryParamMap.subscribe(params => {
      const cityId = params.get('cityId') || '';
      if (!cityId) {
        getAllPlaces(this.dataService, this.placeList);
        return;
      }
      this.dataService.getPlacesByCityId(cityId).then(res => {
        const { status, data } = res;
        if (status === StatusCode.Ok && data.length) {
          this.placeList.setData(data);
          return;
        }
        this.placeList.setData([]);
      });
    });
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
  }
}
