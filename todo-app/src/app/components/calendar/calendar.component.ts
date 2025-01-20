import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CalendarEvent, CalendarView, CalendarMonthViewDay } from 'angular-calendar';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'angular-calendar';
import { Observable, Subject } from 'rxjs';
import { map, catchError, tap, takeUntil } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MeetingService } from '../../services/meeting.service';
import { Meeting } from '../../interfaces/meeting.interface';
import { CreateMeetingComponent } from '../create-meeting/create-meeting.component';
import { ViewMeetingComponent } from '../view-meeting/view-meeting.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    CalendarModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CalendarComponent implements OnInit, OnDestroy {
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  events$: Observable<CalendarEvent[]> = new Observable<CalendarEvent[]>();
  refresh: Subject<void> = new Subject<void>();
  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private meetingService: MeetingService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadMeetings();

    this.translate.onLangChange
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.refresh.next();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loadMeetings(): void {
    this.events$ = this.meetingService.getMeetings().pipe(
      map((meetings: Meeting[]) =>
        meetings.map((meeting: Meeting) => ({
          start: new Date(meeting.startDate),
          title: meeting.name,
          meta: meeting,
        }))
      ),
      catchError(err => {
        console.error('Error loading meetings:', err);
        return [];
      }),
      tap(() => this.refresh.next())
    );
  }

  dayClicked(day: CalendarMonthViewDay): void {
    const dialogRef = this.dialog.open(CreateMeetingComponent, {
      width: '400px',
      data: { selectedDate: day.date }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.unsubscribe$)).subscribe(result => {
      if (result) {
        this.loadMeetings();
      }
    });
  }

  eventClicked(event: CalendarEvent): void {
    const dialogRef = this.dialog.open(ViewMeetingComponent, {
      width: '600px',
      data: { meetings: [event.meta] }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.unsubscribe$)).subscribe(result => {
      if (result) {
        this.loadMeetings();
      }
    });
  }

  badgeClicked(event: Event, calendarEvent: CalendarEvent): void {
    event.stopPropagation();
    this.eventClicked(calendarEvent);
  }
}
