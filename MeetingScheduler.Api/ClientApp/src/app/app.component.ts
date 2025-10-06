import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header class="toolbar">
      <span>Meeting Scheduler</span>
      <span class="spacer"></span>
      <button (click)="login()">Login</button>
      <button (click)="logout()">Logout</button>
    </header>
    <router-outlet></router-outlet>
  `,
  styles: [`.toolbar{display:flex;gap:1rem;align-items:center;padding:8px;border-bottom:1px solid #ddd}.spacer{flex:1}`]
})
export class AppComponent {
  constructor(private msal: MsalService) {}
  login(){ this.msal.loginRedirect(); }
  logout(){ this.msal.logoutRedirect(); }
}
