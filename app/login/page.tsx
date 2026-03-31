import { Suspense } from 'react';
import LoginContent from './login-content';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="text-white text-lg">Chargement...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
