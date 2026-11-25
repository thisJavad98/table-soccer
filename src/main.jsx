import { mount } from './embed.jsx';

// Browser entry — mount only when a real document + #root exist
if (typeof document !== 'undefined') {
  const el = document.getElementById('root');
  if (el) mount(el);
}
