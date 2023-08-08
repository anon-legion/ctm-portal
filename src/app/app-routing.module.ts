import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CityComponent } from './city/city.component';
import { BusRouteComponent } from './bus-route/bus-route.component';

const routes: Routes = [
  { path: '', redirectTo: 'cities', pathMatch: 'full' },
  { path: 'cities', component: CityComponent },
  { path: 'bus-routes', component: BusRouteComponent },
  { path: '**', redirectTo: 'cities' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
