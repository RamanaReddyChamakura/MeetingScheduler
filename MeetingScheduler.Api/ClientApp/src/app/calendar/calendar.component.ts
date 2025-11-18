import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CalendarEvent, CalendarModule, CalendarView } from 'angular-calendar';
import { FormsModule } from '@angular/forms';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, CalendarModule, FormsModule],
  template: `
  <div class="grid two">
    <aside class="sidebar">
      <h3>Rooms</h3>
      <ul class="list rooms">
        <li *ngFor="let r of rooms" (click)="selectRoom(r)" [class.sel]="r.id===selectedRoom?.id">
          <div>
            <div>{{r.name}}</div>
            <div class="meta">{{r.email}} • {{r.capacity}} seats</div>
          </div>
        </li>
      </ul>
      <div style="margin-top:10px">
        <button class="btn" (click)="refresh()">Refresh</button>
      </div>
    </aside>
    <section class="card">
      <div class="card-body">
        <div class="calendar-toolbar">
          <button class="btn" (click)="previous()">Prev</button>
          <select [(ngModel)]="view" class="input" style="width:auto">
            <option [ngValue]="CalendarView.Day">Day</option>
            <option [ngValue]="CalendarView.Week">Week</option>
            <option [ngValue]="CalendarView.Month">Month</option>
          </select>
          <span style="flex:1"></span>
          <strong>{{viewDate | date:'fullDate'}}</strong>
          <button class="btn" (click)="next()">Next</button>
        </div>

        <mwl-calendar-week-view *ngIf="view===CalendarView.Week" [viewDate]="viewDate" [events]="events"></mwl-calendar-week-view>
        <mwl-calendar-month-view *ngIf="view===CalendarView.Month" [viewDate]="viewDate" [events]="events"></mwl-calendar-month-view>
        <mwl-calendar-day-view *ngIf="view===CalendarView.Day" [viewDate]="viewDate" [events]="events"></mwl-calendar-day-view>

        <div class="card" style="margin-top:14px">
          <div class="card-header">Schedule a meeting</div>
          <div class="card-body">
            <div class="form">
              <div>
                <label>Subject</label>
                <input class="input" placeholder="e.g. Project kickoff" [(ngModel)]="subject"/>
              </div>
              <div class="row">
                <div>
                  <label>Start</label>
                  <input class="input" type="datetime-local" [(ngModel)]="startStr"/>
                </div>
                <div>
                  <label>End</label>
                  <input class="input" type="datetime-local" [(ngModel)]="endStr"/>
                </div>
              </div>
              <div>
                <label>Attendees</label>
                <input class="input" placeholder="user1@org.com, user2@org.com" [(ngModel)]="attendees"/>
              </div>
              <div>
                <label>Time zone</label>
                <select class="input" [(ngModel)]="timeZoneId">
                  <option value="UTC">UTC</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                </select>
              </div>
              <div>
                <button class="btn primary" (click)="schedule()" [disabled]="!selectedRoom">Schedule</button>
              </div>
              <div *ngIf="availabilityView" class="availability"><strong>Availability</strong>\n{{availabilityView}}</div>
              <div *ngIf="error" class="error">{{error}}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  `,
  styles: []
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
