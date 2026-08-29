import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'hi', label: 'हि', full: 'हिंदी' },
  { code: 'mr', label: 'म', full: 'मराठी' },
];

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('mandi-lang', code);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Globe size={13} className="text-mandi-subtle flex-shrink-0" />
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          title={lang.full}
          className={`text-xs font-bold px-1.5 py-0.5 rounded-md transition-colors ${
            i18n.language === lang.code
              ? 'bg-mandi-green text-black'
              : 'text-mandi-muted hover:text-mandi-text'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
