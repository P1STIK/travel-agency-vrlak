import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, CreateStaffPayload, Driver, StaffMember, UpdateStaffPayload } from '../admin-api.service';

interface EditForm {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DRIVER';
  driverId: string;
  active: boolean;
  password: string;
}

@Component({
  selector: 'app-admin-staff',
  imports: [FormsModule],
  templateUrl: './admin-staff.component.html',
  styleUrl: './admin-staff.component.css',
})
export class AdminStaffComponent implements OnInit {
  private api = inject(AdminApiService);

  staff   = signal<StaffMember[]>([]);
  drivers = signal<Driver[]>([]);
  loading = signal(true);

  showForm = signal(false);
  saving   = signal(false);
  createError = signal('');

  editId    = signal<string | null>(null);
  editForm: EditForm | null = null;
  editSaving = signal(false);
  editError  = signal('');

  form: CreateStaffPayload = this.emptyForm();

  ngOnInit() {
    this.api.getDrivers().subscribe(d => this.drivers.set(d));
    this.loadStaff();
  }

  loadStaff() {
    this.loading.set(true);
    this.api.getStaff().subscribe({
      next: s => { this.staff.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  emptyForm(): CreateStaffPayload {
    return { email: '', name: '', password: '', role: 'DRIVER', driverId: null };
  }

  submit() {
    this.createError.set('');
    this.saving.set(true);
    const payload: CreateStaffPayload = { ...this.form, driverId: this.form.driverId || null };
    this.api.createStaff(payload).subscribe({
      next: () => {
        this.showForm.set(false);
        this.form = this.emptyForm();
        this.saving.set(false);
        this.loadStaff();
      },
      error: (e) => {
        this.saving.set(false);
        this.createError.set(e?.error?.message ?? 'Chyba pri vytváraní zamestnanca');
      },
    });
  }

  startEdit(s: StaffMember) {
    this.editId.set(s.id);
    this.editError.set('');
    this.editForm = {
      id: s.id,
      email: s.email,
      name: s.name,
      role: s.role,
      driverId: s.driverId ?? '',
      active: s.active,
      password: '',
    };
  }

  cancelEdit() {
    this.editId.set(null);
    this.editForm = null;
  }

  saveEdit() {
    if (!this.editForm) return;
    const f = this.editForm;
    this.editError.set('');
    this.editSaving.set(true);
    const payload: UpdateStaffPayload = {
      email: f.email,
      name: f.name,
      role: f.role,
      driverId: f.driverId || null,
      active: f.active,
    };
    if (f.password) payload.password = f.password;

    this.api.updateStaff(f.id, payload).subscribe({
      next: () => {
        this.editSaving.set(false);
        this.cancelEdit();
        this.loadStaff();
      },
      error: (e) => {
        this.editSaving.set(false);
        this.editError.set(e?.error?.message ?? 'Chyba pri ukladaní');
      },
    });
  }

  roleLabel(r: string): string {
    return r === 'ADMIN' ? 'Administrátor' : 'Vodič';
  }

  formatDate(iso: string | null): string {
    return iso ? new Date(iso).toLocaleString('sk-SK') : 'Nikdy';
  }
}
