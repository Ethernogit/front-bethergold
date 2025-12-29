import { Component } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { UiService } from '../../services/ui.service';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { ChangePasswordModalComponent } from '../../components/auth/change-password-modal/change-password-modal.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterModule,
    AppSidebarComponent,
    BackdropComponent,
    ChangePasswordModalComponent
  ],
  templateUrl: './app-layout.component.html',
})

export class AppLayoutComponent {
  readonly isExpanded$;
  readonly isHovered$;
  readonly isMobileOpen$;
  readonly changePasswordModalVisible$;

  constructor(
    public sidebarService: SidebarService,
    public uiService: UiService
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isHovered$ = this.sidebarService.isHovered$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.changePasswordModalVisible$ = this.uiService.changePasswordModalVisible$;
  }

  get containerClasses() {
    return [
      'flex-1',
      'transition-all',
      'duration-300',
      'ease-in-out',
      (this.isExpanded$ || this.isHovered$) ? 'xl:ml-[290px]' : 'xl:ml-[90px]',
      this.isMobileOpen$ ? 'ml-0' : ''
    ];
  }

}
