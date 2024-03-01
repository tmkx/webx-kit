import type { Key } from 'react-aria-components';
import { ArrowRightLeftIcon, PowerIcon, WrenchIcon } from 'lucide-react';
import { Menu, MenuItem, MenuSeparator } from '@/components';
import { useBodyThemeClass } from '@/hooks/config';
import { useActiveProfileId, useProfileList } from '@/hooks';

export const App = () => {
  useBodyThemeClass();
  const [activeProfileId, setActiveProfileId] = useActiveProfileId();
  const profileList = useProfileList();

  function selectProfile(key: Key) {
    if (key === 'options') return chrome.runtime.openOptionsPage();
    if (typeof key === 'string') setActiveProfileId(key).then(chrome.tabs.reload);
  }

  return (
    <Menu
      className="[clip-path:none] min-w-48"
      aria-label="Proxy profiles"
      selectionMode="single"
      selectedKeys={activeProfileId ? [activeProfileId] : []}
      onAction={selectProfile}
      onClose={window.close}
    >
      <MenuItem id="direct" icon={<ArrowRightLeftIcon size={16} />}>
        [Direct]
      </MenuItem>
      <MenuItem id="system" icon={<PowerIcon size={16} />} textValue="System Proxy">
        [System Proxy]
      </MenuItem>
      {profileList.length ? (
        <>
          <MenuSeparator />
          {profileList.map((profileId) => (
            <MenuItem key={profileId} id={profileId}>
              {profileId}
            </MenuItem>
          ))}
        </>
      ) : null}
      <MenuSeparator />
      <MenuItem id="options" icon={<WrenchIcon size={16} />}>
        Options
      </MenuItem>
    </Menu>
  );
};
