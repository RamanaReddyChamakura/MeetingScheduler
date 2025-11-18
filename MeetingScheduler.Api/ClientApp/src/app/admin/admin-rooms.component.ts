import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-admin-rooms',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
  <section class="grid">
    <div class="card">
      <div class="card-header">Create room</div>
      <div class="card-body">
        <form class="form" (ngSubmit)="create()" #f="ngForm">
          <div class="row">
            <div>
              <label>Name</label>
              <input class="input" name="name" [(ngModel)]="room.name" placeholder="e.g. Ocean View" required />
            </div>
            <div>
              <label>Email</label>
              <input class="input" name="email" [(ngModel)]="room.email" placeholder="room@org.com" required />
            </div>
          </div>
          <div class="row">
            <div>
              <label>Capacity</label>
              <input class="input" name="capacity" type="number" [(ngModel)]="room.capacity" placeholder="8" />
            </div>
            <div>
              <label>Location</label>
              <input class="input" name="location" [(ngModel)]="room.location" placeholder="Building A, 3rd floor" />
            </div>
          </div>
          <div>
            <button class="btn primary" type="submit">Create</button>
            <button class="btn" type="button" (click)="seed()">Import from Graph</button>
          </div>
          <div *ngIf="msg" class="meta">{{msg}}</div>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-header">All rooms</div>
      <div class="card-body">
        <ul class="list">
          <li *ngFor="let r of rooms">
            <div>
              <div>{{r.name}}</div>
              <div class="meta">{{r.email}} • {{r.capacity}} seats • {{r.location}}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
  `
})
export class AdminRoomsComponent implements OnInit {
    rooms: any[] = []; msg = '';
    room: any = { name: '', email: '', capacity: 0, location: '' };
    constructor(private http: HttpClient) { }
    ngOnInit() { this.load(); }
  load() { this.http.get<any[]>(`/api/rooms`).subscribe(r => this.rooms = r); }
  create() { this.http.post(`/api/admin/rooms`, this.room).subscribe(_ => { this.msg = 'Created'; this.load(); }); }
  seed() { this.http.post(`/api/admin/seed-rooms`, {}).subscribe((r: any) => { this.msg = `Imported ${r.added} rooms`; this.load(); }); }
}
