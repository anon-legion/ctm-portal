import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpStatusCode as StatusCode } from '@angular/common/http';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { DataService } from '../data.service';
import download from '../shared/download';
import lngLatValidator from '../shared/lng-lat-validator';
import PathQuerySetter from '../shared/path-query-setter';
import TableDataSource from '../shared/table-data-source';
import { toLngLat, toTitleCase } from '../shared/utils';
import { Place, City, PlaceTd } from '../types';

function getAllPlaces(
  service: DataService,
  placeList: TableDataSource<PlaceTd>
) {
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
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  templateUrl: './place.component.html',
  styleUrls: ['./place.component.scss'],
})
export class PlaceComponent implements OnInit, OnDestroy {
  private _sub: Subscription = new Subscription();
  allCity: City = {
    _id: 'all',
    name: 'all places',
    isActive: true,
  };
  selectedCity = this.allCity;
  selectedPlace: Place['_id'] = '';
  placeList = new TableDataSource<PlaceTd>([]);
  displayedColumns = ['name', 'cityId'];
  url: PathQuerySetter;

  // form properties
  nameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
  ]);
  aliasControl = new FormControl([] as string[]);
  isActiveControl = new FormControl(true, [Validators.required]);
  typeControl = new FormControl('');
  coordsControl = new FormControl('', [lngLatValidator]);
  placeForm = new FormGroup({
    name: this.nameControl,
    aliases: this.aliasControl,
    isActive: this.isActiveControl,
    type: this.typeControl,
    coords: this.coordsControl,
  });
  isEditMode = false;

  constructor(
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _route: ActivatedRoute,
    private dataService: DataService
  ) {
    this.url = new PathQuerySetter(this._router, this._route, {
      cityId: 'all',
    });
    const cityId = this._route.snapshot.queryParamMap.get('cityId');

    if (!cityId) {
      this.dataService.getAllCities();
      this.url.setQueryParams();
      return;
    }

    this.dataService.getAllCities().then(res => {
      const cityList = res.data as City[];
      const currentCity = [...cityList, this.allCity].find(
        city => city._id === cityId
      );

      // if cityId is not valid, set allCity and get all places
      if (!currentCity) {
        this.url.setQueryParams();
        return;
      }

      if (currentCity === this.allCity) return;

      this.selectedCity = currentCity;
    });
  }

  get cityList() {
    return this.dataService.cityList;
  }

  setEditMode(
    isEditMode: boolean,
    selectedPlace: Place['_id'] = '',
    formVals: Record<string, boolean | string | string[]> = {
      aliases: [],
      isActive: true,
    }
  ) {
    this.isEditMode = isEditMode;
    this.selectedPlace = selectedPlace;
    this.placeForm.reset(formVals);
  }

  editPlace(placeId: Place['_id'], data: Place, nameControl: FormControl) {
    this.dataService.updatePlaceById(placeId, data).then(res => {
      const { status, data } = res;

      if (status === StatusCode.NotFound) return;
      if (status === StatusCode.Conflict) {
        nameControl.setErrors({ error: 'duplicate' });
        this._snackBar.open('Name already exists', 'Close', {
          duration: 3000,
        });
        return;
      }

      if (status === StatusCode.Ok) {
        this._snackBar.open('Update success', 'Close', { duration: 3000 });
        this.placeList.updateById(data._id, data);
        this.setEditMode(false);
      }
    });
  }

  addPlace(data: Place, nameControl: FormControl) {
    this.dataService.addNewPlace(data).then(res => {
      const { status, data } = res;

      if (status === StatusCode.Conflict) {
        nameControl.setErrors({ conflict: true });
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

  placeFormOnSubmit() {
    const nameControl = this.nameControl;

    if (!nameControl || !nameControl.value) return;
    if (this.selectedCity === this.allCity) {
      this._snackBar.open('Please select a city', 'Close', { duration: 3000 });
      return;
    }

    const coords = this.coordsControl.value
      ? toLngLat(this.coordsControl.value)
      : null;
    const type = this.typeControl.value ? this.typeControl.value : null;
    const formData = {
      ...this.placeForm.value,
      cityId: this.selectedCity._id,
      name: toTitleCase(nameControl.value),
      type,
      coords,
    } as Place;

    // update place
    if (this.isEditMode) {
      this.editPlace(this.selectedPlace, formData, nameControl);
      this.url.setQueryParams({ placeId: null });
      return;
    }

    // add new place
    this.addPlace(formData, nameControl);
  }

  selectCityOnChange(e: MatSelectChange) {
    if (e.value === this.allCity) {
      this.url.setQueryParams();
      return;
    }

    const city = e.value as City;
    this.url.setQueryParams({ cityId: city._id });
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
      filteredAlias.push(value);
      this.aliasControl.setValue(filteredAlias);
    }

    // clear the input value
    event.chipInput.clear();
  }

  rowOnClick(row: PlaceTd) {
    if (row._id === this.selectedPlace) {
      this.url.setQueryParams({ placeId: null });
      this.setEditMode(false);
      return;
    }

    const cityId = this._route.snapshot.queryParamMap.get('cityId');
    const placeCity = this.cityList.find(city => city._id === row.cityId._id);

    if (!placeCity) return;

    this.selectedCity = placeCity;

    if (cityId !== placeCity?._id) {
      this.url.setQueryParams({ cityId: placeCity?._id, placeId: row._id });
      return;
    }

    this.url.setQueryParams({ placeId: row._id });
  }

  deleteOnClick(placeId: string) {
    this.dataService.deletePlaceById(placeId).then(res => {
      const { status } = res;

      if (status === StatusCode.Ok) {
        this.placeList.removeById(placeId);
        this._snackBar.open('Deleted', 'Close', {
          duration: 3000,
        });
        this.setEditMode(false);
      }
    });
  }

  navigateTo(placeId: string) {
    this._router.navigate(['route-stops'], {
      queryParams: {
        placeId,
        cityId: this.selectedCity._id,
      },
      queryParamsHandling: 'merge',
    });
  }

  setOrDlOnClick(placeId: string) {
    if (this.isEditMode) {
      this.navigateTo(placeId);
      return;
    }

    download(this.placeList.value, 'places');
  }

  ngOnInit() {
    // handles updating placeList when cityId changes
    this._sub = this._route.queryParamMap.subscribe(params => {
      const cityId = params.get('cityId') ?? '';
      const placeId = params.get('placeId') ?? '';

      if (!cityId || cityId === this.allCity._id) {
        getAllPlaces(this.dataService, this.placeList);
        return;
      }

      this.dataService.getPlacesByCityId(cityId).then(res => {
        const { status, data } = res;

        if (status === StatusCode.Ok && data.length) {
          this.placeList.setData(data);
        } else {
          this.placeList.setData([]);
        }

        const place = data.find(place => place._id === placeId);

        if (placeId && place) {
          this.setEditMode(true, placeId, {
            name: place.name,
            aliases: place.aliases ?? [],
            isActive: place.isActive ?? true,
            type: place.type ?? '',
            coords: place.coords?.join(', ') ?? '',
          });
        }
      });
    });
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
  }
}
