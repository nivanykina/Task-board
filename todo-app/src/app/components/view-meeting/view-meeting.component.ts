import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MeetingService } from '../../services/meeting.service';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user.interface';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { TooltipDirective } from '../../shared/tooltip.directive';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-meeting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatSelectModule, MatTabsModule, TooltipDirective, TranslateModule],
  templateUrl: './view-meeting.component.html',
  styleUrls: ['./view-meeting.component.css']
})
export class ViewMeetingComponent implements OnInit, OnDestroy {
  meetingForms: FormGroup[] = [];
  users: User[] = [];
  originalFormsData: any[] = [];
  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private meetingService: MeetingService,
    private userService: UserService,
    private dialogRef: MatDialogRef<ViewMeetingComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { meetings: any[] }
  ) {}

  ngOnInit(): void {
    this.initializeForms();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  initializeForms(): void {
    console.log('Received meetings data:', this.data.meetings);
    this.userService.getUsers().pipe(
      takeUntil(this.unsubscribe$),
      catchError(err => {
        console.error('Error fetching users:', err);
        return [];
      })
    ).subscribe((users: User[]) => {
      this.users = users;
      this.data.meetings.forEach((meeting: any) => {
        console.log('Processing meeting:', meeting);
        const formGroup = this.fb.group({
          id: [meeting.id],
          name: [meeting.name, Validators.required],
          description: [meeting.description],
          userIds: [meeting.userIds, Validators.required],
          startDate: [this.getFormattedDate(meeting.startDate), Validators.required]
        });
        this.meetingForms.push(formGroup);
        this.originalFormsData.push(formGroup.getRawValue());
      });
      console.log('Meeting forms:', this.meetingForms);
    });
  }

  getFormattedDate(date: any): string {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, -8);
  }

  areFormsValid(): boolean {
    return this.meetingForms.every(form => form.valid);
  }

  areFormsChanged(): boolean {
    return this.meetingForms.some((form, index) => JSON.stringify(form.getRawValue()) !== JSON.stringify(this.originalFormsData[index]));
  }

  onUpdate(): void {
    const updateObservables = this.meetingForms.map(form => {
      return this.meetingService.updateMeeting(form.value).pipe(
        takeUntil(this.unsubscribe$),
        catchError(err => {
          console.error('Error updating meeting:', err);
          return [];
        })
      );
    });

    forkJoin(updateObservables).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  onDelete(meetingId: string): void {
    this.meetingService.deleteMeeting(meetingId).pipe(
      takeUntil(this.unsubscribe$),
      catchError(err => {
        console.error('Error deleting meeting:', err);
        return [];
      })
    ).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
