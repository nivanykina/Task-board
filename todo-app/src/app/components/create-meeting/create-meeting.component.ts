import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MeetingService } from '../../services/meeting.service';
import { UserService } from '../../services/user.service';
import { User } from '../../interfaces/user.interface';
import { MatSelectModule } from '@angular/material/select';
import { TooltipDirective } from '../../shared/tooltip.directive';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-create-meeting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatSelectModule, TooltipDirective, TranslateModule],
  templateUrl: './create-meeting.component.html',
  styleUrls: ['./create-meeting.component.css']
})
export class CreateMeetingComponent implements OnInit, OnDestroy {
  meetingForm: FormGroup;
  users: User[] = [];
  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private meetingService: MeetingService,
    private userService: UserService,
    private dialogRef: MatDialogRef<CreateMeetingComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: { selectedDate: Date }
  ) {
    this.meetingForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      userIds: [[], Validators.required],
      startDate: [this.getFormattedDate(data?.selectedDate), Validators.required]
    });
  }

  ngOnInit(): void {
    this.userService.getUsers().pipe(
      takeUntil(this.unsubscribe$),
      catchError(err => {
        console.error('Error fetching users:', err);
        return [];
      })
    ).subscribe((users: User[]) => {
      this.users = users;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getFormattedDate(date: Date): string {
    if (!date) {
      date = new Date();
    }
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, -8);
  }

  onSubmit(): void {
    if (this.meetingForm.valid) {
      this.meetingService.addMeeting(this.meetingForm.value).pipe(
        takeUntil(this.unsubscribe$),
        catchError(err => {
          console.error('Error adding meeting:', err);
          return [];
        })
      ).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
