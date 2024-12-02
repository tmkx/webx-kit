import logo from '@/assets/text-logo.svg';

export const App = () => (
  <div className="min-w-96 min-h-10 flex-center flex-col p-12">
    <img className="h-10" src={logo} alt="Logo" />
    <div className="mt-4 text-slate-700">Popup Page</div>
  </div>
);
