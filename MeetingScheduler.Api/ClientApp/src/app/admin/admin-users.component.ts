import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <h2>Admin Users</h2>
  <div>
    <input [(ngModel)]="upn" placeholder="user@tenant"/>
    <button (click)="grant()">Grant Admin</button>
  </div>
  <ul>
    <li *ngFor="let u of admins">{{u}}</li>
  </ul>
  `
})
export class AdminUsersComponent implements OnInit {
  apiBase = 'https://localhost:5001';
  admins:string[]=[]; upn='';
  constructor(private http: HttpClient) {}
  ngOnInit(){ this.refresh(); }
  refresh(){ this.http.get<string[]>(`${this.apiBase}/api/admin/admins`).subscribe(r=> this.admins = r); }
  grant(){ this.http.post(`${this.apiBase}/api/admin/grant-admin`, JSON.stringify(this.upn), { headers: { 'Content-Type': 'application/json' }}).subscribe(_=> this.refresh()); }
}
