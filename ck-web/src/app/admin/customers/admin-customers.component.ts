import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, AdminCustomer } from '../admin-api.service';

@Component({
  selector: 'app-admin-customers',
  imports: [FormsModule],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.css',
})
export class AdminCustomersComponent implements OnInit {
  private api = inject(AdminApiService);

  customers = signal<AdminCustomer[]>([]);
  loading = signal(true);
  search = signal('');

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.customers();
    return this.customers().filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.api.getCustomers().subscribe({
      next: c => { this.customers.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('sk-SK');
  }
}
