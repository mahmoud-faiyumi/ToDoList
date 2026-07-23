import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProductivityDashboardComponent } from '../components/dashboard/productivity-dashboard/productivity-dashboard.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, RouterLinkActive, ProductivityDashboardComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {}
