import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.css'],
  imports: [RouterModule],
})
export class PageNotFoundComponent {
  public title: string = '404 - Page Not Found';
  public message: string = 'The page you are looking for does not exist.';
  public linkText: string = 'Go back to tasks';
  public linkUrl: string = '/tasks';
}
