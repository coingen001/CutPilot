// Pagine di solo testo (prezzi, note legali, privacy): stile, caratteri e modulo della lista d'attesa.
import '@fontsource-variable/outfit';
import '@fontsource-variable/figtree';
import './style.css';
import { track } from './track';

track('view');

const form = document.querySelector<HTMLFormElement>('form.waitlist');
if (form) {
  const msg = form.querySelector<HTMLElement>('.msg')!;
  document.querySelectorAll<HTMLButtonElement>('[data-plan]').forEach((button) =>
    button.addEventListener('click', () => {
      const plan = button.dataset.plan!;
      track('plan_click');
      form.hidden = false;
      (form.elements.namedItem('plan') as HTMLInputElement).value = plan;
      form.querySelector('[data-plan-label]')!.textContent = plan;
      msg.textContent = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (form.elements.namedItem('email') as HTMLInputElement).focus({ preventScroll: true });
    }),
  );
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
    try {
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!res.ok) throw new Error(String(res.status));
      msg.textContent = form.dataset.ok!;
      track('waitlist');
      (form.elements.namedItem('email') as HTMLInputElement).value = '';
    } catch {
      msg.textContent = form.dataset.err!;
    }
  });
}
