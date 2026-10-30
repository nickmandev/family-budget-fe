import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Temporary landing page used to verify the scaffold builds and serves.
 * It will be replaced by the real dashboard in a later task.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-screen items-center justify-center bg-violet-50">
      <div class="text-center">
        <h1
          class="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent"
        >
          Family Budget App
        </h1>
        <p class="mt-4 text-slate-600">Scaffold ready.</p>
      </div>
    </main>
  `,
})
export class HomeComponent {}
