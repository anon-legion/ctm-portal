import { Component } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';

interface Link {
  label: string;
  path: string;
  queryParams: { [key: string]: string };
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  links: Link[] = [
    { label: 'Cities', path: 'cities', queryParams: {} },
    { label: 'Routes', path: 'bus-routes', queryParams: {} },
    { label: 'Places', path: 'places', queryParams: {} },
    {
      label: 'Route Stops',
      path: 'route-stops',
      queryParams: { cityId: 'all', routeId: 'all' },
    },
  ];
  currentRoute = '';
  constructor(private _router: Router) {
    this._router.events.subscribe((e: RouterEvent) => {
      if (e instanceof NavigationEnd) {
        this.currentRoute = e.url.split('?')[0].replace('/', '');
        console.log(this.currentRoute);
      }
    });
  }

  anchorOnClick(link: Link) {
    this._router.navigate([link.path], {
      queryParams: link.queryParams,
    });
  }
}
