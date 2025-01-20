import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  addUser(user: User): Observable<User> {
    user.id = uuidv4();
    return this.http.post<User>(this.apiUrl, user).pipe(
      catchError((error) => {
        console.error('Add user error:', error);
        return throwError(() => new Error('Failed to add user'));
      }),
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getUserByName(name: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}?name=${name}`);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Delete user error:', error);
        return throwError(() => new Error('Failed to delete user'));
      }),
    );
  }
}
