import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LANGUAGES } from '@/lib/constants';
import type { Language } from '@/types';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onSelect: (language: Language) => void;
  onContinue: () => void;
}

export function LanguageSelector({ selectedLanguage, onSelect, onContinue }: LanguageSelectorProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Select Recording Language</CardTitle>
        <CardDescription>
          Choose the language you'll speak in for better transcription accuracy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant={selectedLanguage === lang.code ? 'default' : 'outline'}
              className="justify-start h-auto py-4 px-6"
              onClick={() => onSelect(lang.code as Language)}
            >
              <span className="text-2xl mr-3">{lang.flag}</span>
              <div className="text-left">
                <div className="font-semibold">{lang.label}</div>
                <div className="text-xs opacity-70">{lang.code.toUpperCase()}</div>
              </div>
            </Button>
          ))}
        </div>

        <Button
          size="lg"
          onClick={onContinue}
          className="w-full mt-4"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
