import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SprintsComponent } from './components/sprints/sprints.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { BacklogComponent } from './components/backlog/backlog.component';
import { BoardComponent } from './components/board/board.component';
import { ScrumEventsComponent } from './components/scrum-events/scrum-events.component';
import { ImpedimentsComponent } from './components/impediments/impediments.component';
import { ReportsComponent } from './components/reports/reports.component';
import { ProfileComponent } from './components/profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'backlog', component: BacklogComponent, canActivate: [authGuard] },
  { path: 'sprints', component: SprintsComponent, canActivate: [authGuard] },
  { path: 'board', component: BoardComponent, canActivate: [authGuard] },
  { path: 'tasks', component: TasksComponent, canActivate: [authGuard] },
  { path: 'scrum-events', component: ScrumEventsComponent, canActivate: [authGuard] },
  { path: 'impediments', component: ImpedimentsComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
