import { Component, Input, inject } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { ThemeToggleButtonComponent } from '../../common/theme-toggle/theme-toggle-button.component';
import { UiService } from '../../../services/ui.service';
import { LoginService } from '../../../services/auth/login.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemTwoComponent, ThemeToggleButtonComponent]
})
export class UserDropdownComponent {
  private loginService = inject(LoginService);
  private uiService = inject(UiService);

  @Input() isCollapsed = false;
  isOpen = false;

  currentUser = this.loginService.currentUser;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  openChangePasswordModal() {
    this.uiService.openChangePasswordModal();
    this.closeDropdown();
  }

  logout() {
    this.loginService.logout().subscribe();
  }
}