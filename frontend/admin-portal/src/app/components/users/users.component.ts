import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User, CreateUserRequest } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  showCreateForm = false;
  createUserForm: FormGroup;
  error = '';
  success = '';
  searchTerm = '';

  availableRoles = [
    { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin' },
    { value: 'PRODUCT_OWNER', label: 'Product Owner' },
    { value: 'SCRUM_MASTER', label: 'Scrum Master' },
    { value: 'DEVELOPER', label: 'Developer' }
  ];

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.createUserForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      roles: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load users';
        this.loading = false;
        console.error(error);
      }
    });
  }

  searchUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = this.users;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.email.toLowerCase().includes(term) ||
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term)
    );
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createUserForm.reset();
      this.error = '';
      this.success = '';
    }
  }

  onSubmit(): void {
    if (this.createUserForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const request: CreateUserRequest = this.createUserForm.value;

    this.userService.createUser(request).subscribe({
      next: (user) => {
        this.success = `User ${user.email} created successfully!`;
        this.createUserForm.reset();
        this.showCreateForm = false;
        this.loadUsers();
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to create user';
        this.loading = false;
        console.error(error);
      }
    });
  }

  updateUserStatus(user: User, newStatus: string): void {
    if (confirm(`Are you sure you want to ${newStatus.toLowerCase()} user ${user.email}?`)) {
      this.userService.updateUserStatus(user.id, newStatus).subscribe({
        next: () => {
          this.success = `User status updated successfully`;
          this.loadUsers();
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = 'Failed to update user status';
          console.error(error);
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.success = `User deleted successfully`;
          this.loadUsers();
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = 'Failed to delete user';
          console.error(error);
        }
      });
    }
  }

  getRoleBadgeClass(roles: string[]): string {
    if (roles.includes('ORGANIZATION_ADMIN')) return 'badge-admin';
    if (roles.includes('PRODUCT_OWNER')) return 'badge-po';
    if (roles.includes('SCRUM_MASTER')) return 'badge-sm';
    return 'badge-dev';
  }

  onRoleChange(event: any, role: string): void {
    const roles = this.createUserForm.get('roles')?.value || [];
    if (event.target.checked) {
      roles.push(role);
    } else {
      const index = roles.indexOf(role);
      if (index > -1) {
        roles.splice(index, 1);
      }
    }
    this.createUserForm.patchValue({ roles });
  }

  isRoleSelected(role: string): boolean {
    const roles = this.createUserForm.get('roles')?.value || [];
    return roles.includes(role);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
