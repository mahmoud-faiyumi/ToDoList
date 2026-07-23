import { Routes } from '@angular/router';
import { ToDoListPageComponent } from './to-do-list-page/to-do-list-page.component';

export const routes: Routes = [
  { path: '', component: ToDoListPageComponent },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard-page/dashboard-page.component').then(m => m.DashboardPageComponent)
  },
  { path: '**', redirectTo: '' }
];
