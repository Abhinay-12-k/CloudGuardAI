import { Toaster } from 'sonner';
import { Router } from './Router';
import { useTabTitle } from '@/hooks/useTabTitle';
import './index.css';

function App() {
  useTabTitle();

  return (
    <>
      <Router />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#334155',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            borderRadius: '12px',
          },
          duration: 4000,
        }}
      />
    </>
  );
}

export default App;
