import { useI18n } from '../i18n/index.jsx';

export default function LangSwitch({ className = '' }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t.lang}>
      <button
        type="button"
        className={lang === 'en' ? 'is-on' : ''}
        onClick={() => setLang('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === 'fa' ? 'is-on' : ''}
        onClick={() => setLang('fa')}
      >
        FA
      </button>
    </div>
  );
}
