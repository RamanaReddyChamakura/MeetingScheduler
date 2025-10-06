import { Routes } from '@angular/router';
import { CalendarComponent } from './app/calendar/calendar.component';
import { AdminRoomsComponent } from './app/admin/admin-rooms.component';
import { AdminUsersComponent } from './app/admin/admin-users.component';
import { canActivateAdmin } from './app/admin/admin.guard';

export const routes: Routes = [
  { path: '', component: CalendarComponent },
  { path: 'admin/rooms', component: AdminRoomsComponent, canActivate: [canActivateAdmin] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [canActivateAdmin] }
];
