import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { I18nProvider } from './i18n/index.jsx';
import './index.css';

let root = null;

/**
 * Mount the game into a DOM element.
 * Safe to import in non-DOM environments — does nothing until called.
 */
export function mount(target) {
  if (typeof document === 'undefined') {
    throw new Error('Table Soccer needs a browser document to mount.');
  }
  const el =
    typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) throw new Error('Mount target not found.');
  if (root) {
    root.unmount();
    root = null;
  }
  root = createRoot(el);
  root.render(
    <StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StrictMode>,
  );
  return root;
}

export function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}

function autoMount() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('root');
  if (el) mount(el);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount, { once: true });
  } else {
    autoMount();
  }
}

