import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
  <section class="grid">
    <div class="card">
      <div class="card-header">Grant admin</div>
      <div class="card-body">
        <div class="form">
          <div>
            <label>User Principal Name</label>
            <input class="input" [(ngModel)]="upn" placeholder="user@tenant.com"/>
          </div>
          <div>
            <button class="btn primary" (click)="grant()">Grant Admin</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">Current admins</div>
      <div class="card-body">
        <ul class="list">
          <li *ngFor="let u of admins">{{u}}</li>
        </ul>
      </div>
    </div>
  </section>
  `
})
export class AdminUsersComponent implements OnInit {
    admins: string[] = []; upn = '';
    constructor(private http: HttpClient) { }
    ngOnInit() { this.refresh(); }
  refresh() { this.http.get<string[]>(`/api/admin/admins`).subscribe(r => this.admins = r); }
  grant() { this.http.post(`/api/admin/grant-admin`, JSON.stringify(this.upn), { headers: { 'Content-Type': 'application/json' } }).subscribe(_ => this.refresh()); }
}
