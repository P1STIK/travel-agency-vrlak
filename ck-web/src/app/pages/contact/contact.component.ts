import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  form = { name: '', email: '', phone: '', message: '' };
  sent = signal(false);

  submit() {
    this.sent.set(true);
  }
}
