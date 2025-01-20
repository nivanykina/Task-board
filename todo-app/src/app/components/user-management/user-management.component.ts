import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { User } from '../../interfaces/user.interface';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
})
export class UserManagementComponent implements OnInit, OnDestroy {
  action: string | null = null;
  userForm: FormGroup;
  users: User[] = [];
  showConfirmModal = false;
  userToDelete: User | null = null;
  errorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService,
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      login: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.action = this.route.snapshot.paramMap.get('action');
    this.authService
      .getUsers()
      .pipe(
        takeUntil(this.destroy$),
        tap({
          next: (users) => (this.users = users),
          error: (err) => console.error('Failed to load users', err),
        }),
      )
      .subscribe();
  }

  addUser() {
    if (this.userForm.valid) {
      const newUser: User = { ...this.userForm.value, id: '' };
      this.authService
        .addUser(newUser)
        .pipe(
          takeUntil(this.destroy$),
          tap({
            next: (addedUser) => {
              if (addedUser && addedUser.id) {
                this.users.push(addedUser);
                console.log('User added successfully with id:', addedUser.id);
                this.router.navigate(['/login']).then(
                  () => console.log('Navigation successful!'),
                  (error) => console.error('Navigation error:', error),
                );
              } else {
                console.error('User added without an id:', addedUser);
                this.errorMessage = this.translate.instant('errorOccurred');
              }
            },
            error: (error) => {
              console.error('Add user error:', error);
              this.errorMessage = this.translate.instant('errorOccurred');
            },
          }),
        )
        .subscribe();
    }
  }

  confirmDelete(user: User) {
    this.showConfirmModal = true;
    this.userToDelete = user;
  }

  deleteUser() {
    if (this.userToDelete && this.userToDelete.id) {
      this.authService
        .deleteUser(this.userToDelete.id)
        .pipe(
          takeUntil(this.destroy$),
          tap({
            next: () => {
              this.showConfirmModal = false;
              this.users = this.users.filter(
                (user) => user.id !== this.userToDelete!.id,
              );
              this.userToDelete = null;
              this.router.navigate(['/login']).then(
                () => console.log('Navigation successful!'),
                (error) => console.error('Navigation error:', error),
              );
            },
            error: (err) => {
              console.error('Delete user error:', err);
              this.errorMessage = this.translate.instant('errorOccurred');
            },
          }),
        )
        .subscribe();
    } else {
      console.error('User ID is missing');
    }
  }

  closeModal() {
    this.showConfirmModal = false;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
