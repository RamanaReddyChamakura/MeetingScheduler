import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CalendarEvent, CalendarModule, CalendarView, DateAdapter } from 'angular-calendar';
import { FormsModule } from '@angular/forms';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, CalendarModule, FormsModule],
  providers: [{ provide: DateAdapter, useFactory: adapterFactory }],
  template: `
  <div class="container">
    <div class="sidebar">
      <h3>Rooms</h3>
      <ul>
        <li *ngFor="let r of rooms" (click)="selectRoom(r)" [class.sel]="r.id===selectedRoom?.id">{{r.name}} ({{r.capacity}})</li>
      </ul>
      <button (click)="refresh()">Refresh</button>
    </div>
    <div class="main">
      <div class="toolbar">
        <button (click)="previous()">Prev</button>
        <select [(ngModel)]="view">
          <option [ngValue]="CalendarView.Day">Day</option>
          <option [ngValue]="CalendarView.Week">Week</option>
          <option [ngValue]="CalendarView.Month">Month</option>
        </select>
        <span>{{viewDate | date:'fullDate'}}</span>
        <button (click)="next()">Next</button>
      </div>
      <mwl-calendar-week-view *ngIf="view===CalendarView.Week" [viewDate]="viewDate" [events]="events"></mwl-calendar-week-view>
      <mwl-calendar-month-view *ngIf="view===CalendarView.Month" [viewDate]="viewDate" [events]="events"></mwl-calendar-month-view>
      <mwl-calendar-day-view *ngIf="view===CalendarView.Day" [viewDate]="viewDate" [events]="events"></mwl-calendar-day-view>

      <div class="create">
        <input placeholder="Subject" [(ngModel)]="subject"/>
        <input type="datetime-local" [(ngModel)]="startStr"/>
        <input type="datetime-local" [(ngModel)]="endStr"/>
        <input placeholder="Attendees comma separated" [(ngModel)]="attendees"/>
        <select [(ngModel)]="timeZoneId">
          <option value="UTC">UTC</option>
          <option value="America/Los_Angeles">America/Los_Angeles</option>
          <option value="America/New_York">America/New_York</option>
          <option value="Europe/London">Europe/London</option>
          <option value="Asia/Kolkata">Asia/Kolkata</option>
        </select>
        <button (click)="schedule()" [disabled]="!selectedRoom">Schedule</button>
      </div>
      <div *ngIf="availabilityView">Availability: {{availabilityView}}</div>
      <div *ngIf="error" class="error">{{error}}</div>
    </div>
  </div>
  `,
  styles: [
    `.container{display:flex;gap:12px}.sidebar{width:240px;border-right:1px solid #eee;padding-right:12px}.main{flex:1}.sel{font-weight:600}.toolbar{display:flex;gap:1rem;align-items:center}`
  ]
})
export class CalendarComponent implements OnInit {
  CalendarView = CalendarView;
  apiBase = '';
  rooms: any[] = [];
  selectedRoom: any | null = null;
  view: CalendarView = CalendarView.Week;
  viewDate = new Date();
  events: CalendarEvent[] = [];
  subject = '';
  startStr = '';
  endStr = '';
  attendees = '';
  timeZoneId = 'UTC';
  availabilityView = '';
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.refresh();
  }

  refresh(){
    this.http.get<any[]>(`/api/rooms`).subscribe(r=> this.rooms = r);
    this.loadAvailability();
  }

  selectRoom(r:any){ this.selectedRoom = r; this.loadAvailability(); }

  loadAvailability(){
    if (!this.selectedRoom?.email) { this.availabilityView=''; return; }
    const start = new Date(this.viewDate); const end = new Date(this.viewDate);
    if (this.view === CalendarView.Day) { /* same day */ }
    if (this.view === CalendarView.Week) { start.setDate(start.getDate() - start.getDay()); end.setDate(start.getDate()+6); }
    if (this.view === CalendarView.Month) { start.setDate(1); end.setMonth(start.getMonth()+1); end.setDate(0); }
    const qs = `?start=${start.toISOString()}&end=${end.toISOString()}&interval=30`;
    this.http.get<any>(`/api/availability/rooms/${encodeURIComponent(this.selectedRoom.email)}${qs}`).subscribe(r=> this.availabilityView = r.availabilityView);
  }

  previous(){
    if (this.view===CalendarView.Day) this.viewDate = new Date(this.viewDate.setDate(this.viewDate.getDate()-1));
    if (this.view===CalendarView.Week) this.viewDate = new Date(this.viewDate.setDate(this.viewDate.getDate()-7));
    if (this.view===CalendarView.Month) this.viewDate = new Date(this.viewDate.setMonth(this.viewDate.getMonth()-1));
    this.loadAvailability();
  }
  next(){
    if (this.view===CalendarView.Day) this.viewDate = new Date(this.viewDate.setDate(this.viewDate.getDate()+1));
    if (this.view===CalendarView.Week) this.viewDate = new Date(this.viewDate.setDate(this.viewDate.getDate()+7));
    if (this.view===CalendarView.Month) this.viewDate = new Date(this.viewDate.setMonth(this.viewDate.getMonth()+1));
    this.loadAvailability();
  }

  schedule(){
    this.error = '';
    const start = new Date(this.startStr);
    const end = new Date(this.endStr);
    const req = {
      subject: this.subject,
      start: start.toISOString(),
      end: end.toISOString(),
      attendees: this.attendees.split(',').map((a:string)=>a.trim()).filter(Boolean),
      roomId: this.selectedRoom?.id,
      timeZoneId: this.timeZoneId
    };
    this.http.post<{id:string}>(`/api/meetings`, req).subscribe({
      next: _ => alert('Scheduled'),
      error: err => this.error = err?.error?.error || 'Failed'
    });
  }
}
