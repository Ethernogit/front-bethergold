import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, map, startWith } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UiService {
    private changePasswordModalVisible = new BehaviorSubject<boolean>(false);
    changePasswordModalVisible$ = this.changePasswordModalVisible.asObservable();

    isFullscreen$ = fromEvent(document, 'fullscreenchange').pipe(
        map(() => !!document.fullscreenElement),
        startWith(false)
    );

    openChangePasswordModal() {
        this.changePasswordModalVisible.next(true);
    }

    closeChangePasswordModal() {
        this.changePasswordModalVisible.next(false);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}
