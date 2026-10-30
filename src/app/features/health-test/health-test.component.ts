import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';

import { HealthResponse, HealthService } from '../../core/api/generated';

type HealthState = 'loading' | 'success' | 'error';

/**
 * Temporary smoke-test page for the HTTP wiring: calls `GET /health` through
 * the generated client and shows the raw result. It will be removed once the
 * dashboard lands.
 */
@Component({
  selector: 'app-health-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
  template: `
    <main class="flex min-h-screen items-center justify-center bg-violet-50 p-6">
      <section class="w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 class="text-2xl font-bold text-slate-900">API health check</h1>
        <p class="mt-2 text-sm text-slate-600">
          Verifies that the Angular HTTP client, interceptors and generated OpenAPI client are wired
          to the backend.
        </p>

        <div class="mt-6">
          @switch (state()) {
            @case ('loading') {
              <p class="text-sm text-slate-600">Calling <code>GET /health</code>…</p>
            }
            @case ('success') {
              <p class="text-sm font-medium text-emerald-700">API reachable.</p>
              <pre
                class="mt-3 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-emerald-300"
              >{{ health() | json }}</pre>
            }
            @case ('error') {
              <p class="text-sm font-medium text-rose-700">Health check failed.</p>
              <pre class="mt-3 overflow-auto rounded-lg bg-rose-50 p-4 text-xs text-rose-700">{{
                error()
              }}</pre>
            }
          }
        </div>

        <button
          type="button"
          class="mt-6 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="state() === 'loading'"
          (click)="checkHealth()"
        >
          Check again
        </button>
      </section>
    </main>
  `,
})
export class HealthTestComponent implements OnInit {
  private readonly healthService = inject(HealthService);

  protected readonly state = signal<HealthState>('loading');
  protected readonly health = signal<HealthResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.checkHealth();
  }

  protected checkHealth(): void {
    this.state.set('loading');
    this.error.set(null);

    this.healthService.apiHealth().subscribe({
      next: (health) => {
        this.health.set(health);
        this.state.set('success');
      },
      error: (error: unknown) => {
        this.error.set(error instanceof Error ? error.message : 'Unknown error');
        this.state.set('error');
      },
    });
  }
}
