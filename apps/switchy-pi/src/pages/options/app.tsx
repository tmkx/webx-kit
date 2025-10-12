import React, { Suspense, createElement, useEffect, useState } from 'react';
import { Outlet, createHashRouter, redirect, useNavigate, useLocation, NonIndexRouteObject } from 'react-router-dom';
import { RouterProvider, Selection } from 'react-aria-components';
import { PlusIcon, SaveIcon, SettingsIcon, WrenchIcon } from 'lucide-react';
import { DropdownSection, Link, ListBox, ListBoxItem } from '@/components';
import { useProfileList, useProfileValue } from '@/hooks';
import { About } from './routes/about';
import { General } from './routes/general';
import { IO } from './routes/io';
import { Profile } from './routes/profile';
import { NewProfileModal } from './routes/profile/new-modal';
import { UISettings } from './routes/ui';
import { profileIcons } from './routes/profile/shared';

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
  ...(__DEV__
    ? [
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
      ]
    : []),
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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('prev-pathname', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex h-full w-full">
      <RouterProvider navigate={navigate}>
        <div className="w-72 flex-shrink-0">
          <Navbar />
        </div>
        <div className="flex-1">
          <Suspense fallback="Loading...">
            <Outlet />
          </Suspense>
        </div>
      </RouterProvider>
    </div>
  );
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [newProfileVisible, setNewProfileVisible] = useState(false);

  const handleSelectionChange = async (selection: Selection) => {
    if (selection === 'all') return;
    const selectedKey = selection.values().next().value;
    if (!selectedKey) return;
    switch (selectedKey) {
      case 'new-profile': {
        setNewProfileVisible(true);
      }
    }
  };

  const handleCreate = (profileId: string) => {
    setNewProfileVisible(false);
    navigate(`/profiles/${profileId}`);
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
        <DropdownSection className={dropdownSectionClassName} title="Settings" items={settingsRoutes}>
          {({ path, icon, name }) => {
            const href = `/${path}`;
            return (
              <ListBoxItem key={path} id={href} textValue={name} href={href}>
                {icon}
                <span>{name}</span>
              </ListBoxItem>
            );
          }}
        </DropdownSection>
        <DropdownSection className={dropdownSectionClassName} title="Profiles">
          <ProfilesList />
        </DropdownSection>
        <ListBoxItem id="new-profile" textValue="New Profile...">
          <PlusIcon size={16} />
          <span>New Profile...</span>
          <NewProfileModal isOpen={newProfileVisible} onOpenChange={setNewProfileVisible} onCreate={handleCreate} />
        </ListBoxItem>
      </ListBox>
    </div>
  );
}

function Logo() {
  return (
    <Link className="flex-center mx-2 gap-2 py-2 no-underline" href="/about">
      <img className="h-8 w-8" src="/public/logo.png" alt="Logo" />
      <div className="text-xl font-bold">Switchy Pi</div>
    </Link>
  );
}

function ProfilesList() {
  const profiles = useProfileList();
  return profiles.map(profile => <ProfileListItem key={profile} id={profile} />);
}

function ProfileListItem({ id }: { id: string }) {
  const href = `/profiles/${id}`;
  const profile = useProfileValue(id);
  if (!profile) return null;
  return (
    <ListBoxItem id={href} textValue={`Profile: ${profile.name}`} href={href}>
      {createElement(profileIcons[profile.profileType], { size: 16 })}
      <span>{profile.name}</span>
    </ListBoxItem>
  );
}
