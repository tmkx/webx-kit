import { Outlet, createHashRouter, redirect, useNavigate, useLocation, NonIndexRouteObject } from 'react-router-dom';
import { RouterProvider } from 'react-aria-components';
import { CableIcon, PlusIcon, SaveIcon, ServerIcon, SettingsIcon, WrenchIcon } from 'lucide-react';
import { DropdownSection, Link, ListBox, ListBoxItem } from '@/components';
import { About } from './routes/about';
import { General } from './routes/general';
import { IO } from './routes/io';
import { Profile } from './routes/profile';
import { UI } from './routes/ui';

interface SettingRoute extends NonIndexRouteObject {
  path: string;
  icon: React.ReactNode;
  name: string;
}

const settingsRoutes: SettingRoute[] = [
  {
    path: 'ui',
    icon: <WrenchIcon size={16} />,
    name: 'Interface',
    element: <UI />,
  },
  {
    path: 'general',
    icon: <SettingsIcon size={16} />,
    name: 'General',
    element: <General />,
  },
  {
    path: 'io',
    icon: <SaveIcon size={16} />,
    name: 'Import / Export',
    element: <IO />,
  },
];

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '/',
        loader: () => redirect('/about'),
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'profiles/:id',
        element: <Profile />,
      },
      ...settingsRoutes,
    ],
  },
]);

function RootLayout() {
  const navigate = useNavigate();
  return (
    <div className="w-full h-full flex">
      <RouterProvider navigate={navigate}>
        <div className="w-72">
          <Navbar />
        </div>
        <div className="flex-1">
          <Outlet />
        </div>
      </RouterProvider>
    </div>
  );
}

function Navbar() {
  const location = useLocation();

  const dropdownSectionClassName = '!bg-transparent border-none backdrop-filter-none';

  return (
    <div className="px-2 py-4">
      <Logo />
      <ListBox
        className="mt-2 border-none"
        aria-label="Navbar"
        selectionMode="single"
        selectedKeys={[location.pathname]}
      >
        <DropdownSection className={dropdownSectionClassName} title="Settings">
          {settingsRoutes.map(({ path, icon, name }) => {
            const href = `/${path}`;
            return (
              <ListBoxItem key={path} id={href} textValue={name} href={href}>
                {icon}
                <span>{name}</span>
              </ListBoxItem>
            );
          })}
        </DropdownSection>
        <DropdownSection className={dropdownSectionClassName} title="Profiles">
          <ListBoxItem id="/profiles/whistle" textValue="Profile: Whistle" href="/profiles/whistle">
            <ServerIcon size={16} />
            <span>Whistle</span>
          </ListBoxItem>
          <ListBoxItem id="/profiles/auto-switch" textValue="Profile: Auto switch" href="/profiles/auto-switch">
            <CableIcon size={16} />
            <span>Auto switch</span>
          </ListBoxItem>
          <ListBoxItem id="new-profile" textValue="New Profile...">
            <PlusIcon size={16} />
            <span>New Profile...</span>
          </ListBoxItem>
        </DropdownSection>
      </ListBox>
    </div>
  );
}

function Logo() {
  return (
    <Link className="flex-center gap-2 mx-2 py-2 no-underline" href="/about">
      <img className="w-8 h-8" src="/public/logo.png" alt="Logo" />
      <div className="text-xl font-bold">Switchy Pi</div>
    </Link>
  );
}
