import { Injectable } from '@angular/core';
import { User } from '../interfaces/user.interface';
import { UserService } from './user.service';
import { Observable, EMPTY } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser: User | null = null;

  constructor(private userService: UserService) {}

  login(username: string, password: string): Observable<boolean> {
    return this.userService.getUserByName(username).pipe(
      map((users) => {
        const isAuthenticated = users.length > 0 && password === 'mockPassword';
        if (isAuthenticated) {
          this.currentUser = users[0];
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        return isAuthenticated;
      }),
    );
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  addUser(user: User): Observable<User> {
    return this.userService.addUser(user).pipe(
      tap((addedUser) => {
        if (addedUser && addedUser.id) {
          console.log(`Added user with id ${addedUser.id}`);
        } else {
          console.error('User added without id:', addedUser);
        }
      }),
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.userService.deleteUser(id).pipe(
      tap(() => console.log(`User with id ${id} deleted`)),
      catchError((error) => {
        console.error('Delete user error:', error);
        return EMPTY;
      }),
    );
  }

  getUsers(): Observable<User[]> {
    return this.userService.getUsers();
  }
}
