import { useEffect } from 'react';
import { Outlet, createHashRouter, redirect, useNavigate, useLocation, NonIndexRouteObject } from 'react-router-dom';
import { RouterProvider, Selection } from 'react-aria-components';
import { CableIcon, PlusIcon, SaveIcon, ServerIcon, SettingsIcon, WrenchIcon } from 'lucide-react';
import { useSetAtom } from 'jotai';
import { profileListAtom } from '@/atoms/profile';
import { DropdownSection, Link, ListBox, ListBoxItem } from '@/components';
import { useBodyThemeClass, useProfileList, useProfileValue } from '@/hooks';
import type { Profile as ProfileType } from '@/schemas';
import { About } from './routes/about';
import { General } from './routes/general';
import { IO } from './routes/io';
import { Profile } from './routes/profile';
import { UISettings } from './routes/ui';

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
    element: <UISettings />,
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
        loader: () => redirect(localStorage.getItem('prev-pathname') || '/about'),
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
  useBodyThemeClass();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('prev-pathname', location.pathname);
  }, [location.pathname]);

  return (
    <div className="w-full h-full flex">
      <RouterProvider navigate={navigate}>
        <div className="w-72 flex-shrink-0">
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
  const setProfileList = useSetAtom(profileListAtom);

  const handleSelectionChange = (selection: Selection) => {
    if (selection === 'all') return;
    const selectedKey = selection.values().next().value;
    if (!selectedKey) return;
    switch (selectedKey) {
      case 'new-profile': {
        setProfileList(async (profileList) => [...(await profileList), Math.random().toString(36).slice(2)]);
      }
    }
  };

  const dropdownSectionClassName = '!bg-transparent border-none backdrop-filter-none';

  return (
    <div className="px-2 py-4">
      <Logo />
      <ListBox
        className="mt-2 border-none"
        aria-label="Navbar"
        selectionMode="single"
        selectedKeys={[location.pathname]}
        onSelectionChange={handleSelectionChange}
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
          <ProfilesList />
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

const profileIcons: Record<ProfileType['profileType'], React.JSX.Element> = {
  FixedProfile: <ServerIcon size={16} />,
  SwitchProfile: <CableIcon size={16} />,
};

function ProfilesList() {
  const profiles = useProfileList();
  return profiles.map((profile) => <ProfileListItem key={profile} id={profile} />);
}

function ProfileListItem({ id }: { id: string }) {
  const href = `/profiles/${id}`;
  const profile = useProfileValue(id);
  if (!profile) return null;
  return (
    <ListBoxItem id={href} textValue={`Profile: ${profile.name}`} href={href}>
      {profileIcons[profile.profileType]}
      <span>{profile.name}</span>
    </ListBoxItem>
  );
}
