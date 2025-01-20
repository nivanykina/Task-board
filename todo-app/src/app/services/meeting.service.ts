import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Meeting } from '../interfaces/meeting.interface';

@Injectable({
  providedIn: 'root',
})
export class MeetingService {
  private readonly apiUrl = 'http://localhost:3000/meetings';

  constructor(private readonly http: HttpClient) {}

  getMeetings(): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(this.apiUrl).pipe(
      catchError(this.handleError('getMeetings'))
    );
  }

  addMeeting(meeting: Meeting): Observable<Meeting> {
    return this.http.post<Meeting>(this.apiUrl, meeting).pipe(
      catchError(this.handleError('addMeeting'))
    );
  }

  updateMeeting(meeting: Meeting): Observable<Meeting> {
    return this.http.put<Meeting>(`${this.apiUrl}/${meeting.id}`, meeting).pipe(
      catchError(this.handleError('updateMeeting'))
    );
  }

  deleteMeeting(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError('deleteMeeting'))
    );
  }

  private handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`${operation} error:`, error);
      return throwError(() => new Error(`Failed to ${operation}`));
    };
  }
}
