import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UiService {
    private changePasswordModalVisible = new BehaviorSubject<boolean>(false);
    changePasswordModalVisible$ = this.changePasswordModalVisible.asObservable();

    openChangePasswordModal() {
        this.changePasswordModalVisible.next(true);
    }

    closeChangePasswordModal() {
        this.changePasswordModalVisible.next(false);
    }
}
