import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="toolbar">
      <span class="brand">Meeting Scheduler</span>
      <nav class="nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
        <a routerLink="/admin/rooms" routerLinkActive="active">Rooms</a>
        <a routerLink="/admin/users" routerLinkActive="active">Admins</a>
      </nav>
      <span class="spacer"></span>
      <button class="btn" (click)="login()">Sign in</button>
      <button class="btn" (click)="logout()">Sign out</button>
    </header>
    <main class="page">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: []
})
export class AppComponent {
  constructor(private msal: MsalService) {}
  login(){ this.msal.loginRedirect(); }
  logout(){ this.msal.logoutRedirect(); }
}
