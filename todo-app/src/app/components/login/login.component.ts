import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { User } from '../../interfaces/user.interface';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, TranslateModule, ReactiveFormsModule],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  currentUser: User | null = null;
  users: User[] = [];
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    this.subscriptions.add(
      this.authService.getUsers().subscribe((users) => (this.users = users)),
    );
    this.currentUser = this.authService.getCurrentUser();
  }

  login() {
    const userName = this.loginForm.get('userName')?.value;
    const password = this.loginForm.get('password')?.value;
    this.subscriptions.add(
      this.authService.login(userName, password).subscribe((success) => {
        if (success) {
          this.currentUser = this.authService.getCurrentUser();
          this.errorMessage = null;
          this.router.navigate(['/tasks']);
        } else {
          this.errorMessage = this.translate.instant('errorOccurred');
        }
      }),
    );
  }

  register() {
    const userName = this.loginForm.get('userName')?.value;
    if (userName.trim()) {
      this.subscriptions.add(
        this.authService
          .addUser({ login: userName, name: '', id: '' })
          .subscribe((newUser) => {
            if (newUser) {
              this.loginForm.patchValue({ userName: newUser.name });
              this.login();
            }
          }),
      );
    } else {
      this.errorMessage = this.translate.instant('fillFieldsTooltip');
    }
  }

  logout() {
    this.authService.logout();
    this.currentUser = null;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
