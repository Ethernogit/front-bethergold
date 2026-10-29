import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { VersionCheckService } from './shared/services/version-check.service';

const CHROME_NOTICE_DISMISSED_KEY = 'chromeNoticeDismissed';

/**
 * Chrome de Google; Edge, Opera, Brave, etc. no cuentan.
 * En iPhone/iPad todos los navegadores usan el motor de Safari: ahí no tiene caso recomendarlo.
 */
function shouldRecommendChrome(): boolean {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
  if (brands) return !brands.some(b => b.brand === 'Google Chrome');
  // Firefox y Safari no tienen userAgentData
  return !(/Chrome\//.test(ua) && !/Edg\/|OPR\/|SamsungBrowser\/|YaBrowser\//.test(ua));
}

function chromeNoticeDismissed(): boolean {
  try {
    return localStorage.getItem(CHROME_NOTICE_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Bether Gold';

  versionCheck = inject(VersionCheckService);
  showChromeNotice = signal(shouldRecommendChrome() && !chromeNoticeDismissed());

  ngOnInit(): void {
    this.versionCheck.start();
  }

  dismissChromeNotice(): void {
    this.showChromeNotice.set(false);
    try {
      localStorage.setItem(CHROME_NOTICE_DISMISSED_KEY, '1');
    } catch {
      // Sin localStorage (modo privado) vuelve a salir en la siguiente visita
    }
  }
}
