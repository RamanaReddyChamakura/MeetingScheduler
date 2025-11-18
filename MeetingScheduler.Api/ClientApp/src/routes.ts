import { Routes } from '@angular/router';
import { CalendarComponent } from './app/calendar/calendar.component';
import { AdminRoomsComponent } from './app/admin/admin-rooms.component';
import { AdminUsersComponent } from './app/admin/admin-users.component';
import { canActivateAdmin } from './app/admin/admin.guard';
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
  { path: '', component: CalendarComponent },
  { path: 'admin/rooms', component: AdminRoomsComponent, canActivate: [MsalGuard, canActivateAdmin] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [MsalGuard, canActivateAdmin] }
];
