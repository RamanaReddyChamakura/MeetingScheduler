import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <h2>Rooms</h2>
  <form (ngSubmit)="create()" #f="ngForm">
    <input name="name" [(ngModel)]="room.name" placeholder="Name" required />
    <input name="email" [(ngModel)]="room.email" placeholder="Email" required />
    <input name="capacity" type="number" [(ngModel)]="room.capacity" placeholder="Capacity" />
    <input name="location" [(ngModel)]="room.location" placeholder="Location" />
    <button type="submit">Create</button>
    <button type="button" (click)="seed()">Import from Graph</button>
  </form>
  <div *ngIf="msg">{{msg}}</div>
  <ul>
    <li *ngFor="let r of rooms">{{r.name}} ({{r.email}}) - {{r.capacity}}</li>
  </ul>
  `
})
export class AdminRoomsComponent implements OnInit {
  apiBase = 'https://localhost:5001';
  rooms:any[]=[]; msg='';
  room:any={ name:'', email:'', capacity:0, location:'' };
  constructor(private http: HttpClient) {}
  ngOnInit(){ this.load(); }
  load(){ this.http.get<any[]>(`${this.apiBase}/api/rooms`).subscribe(r=> this.rooms = r); }
  create(){ this.http.post(`${this.apiBase}/api/admin/rooms`, this.room).subscribe(_=>{ this.msg='Created'; this.load(); }); }
  seed(){ this.http.post(`${this.apiBase}/api/admin/seed-rooms`, {}).subscribe((r:any)=>{ this.msg=`Imported ${r.added} rooms`; this.load(); }); }
}
