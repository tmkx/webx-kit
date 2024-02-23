import type { Key } from 'react-aria-components';
import { ArrowRightLeftIcon, PowerIcon, WrenchIcon } from 'lucide-react';
import { Menu, MenuItem, MenuSeparator } from '@/components';
import { useBodyThemeClass } from '@/hooks/config';

const defaultSelectedKeys = ['system'];

export const App = () => {
  useBodyThemeClass();
  return (
    <Menu
      className="[clip-path:none]"
      aria-label="Proxy profiles"
      defaultSelectedKeys={defaultSelectedKeys}
      onAction={selectProfile}
      onClose={window.close}
    >
      <MenuItem id="direct" textValue="Direct">
        <ArrowRightLeftIcon size={16} />
        <span>[Direct]</span>
      </MenuItem>
      <MenuItem id="system" textValue="System Proxy">
        <PowerIcon size={16} />
        <span>[System Proxy]</span>
      </MenuItem>
      <MenuSeparator />
      <MenuItem id="user-profile1">Whistle</MenuItem>
      <MenuItem id="user-profile2">Auto switch</MenuItem>
      <MenuSeparator />
      <MenuItem id="options" textValue="Options">
        <WrenchIcon size={16} />
        <span>Options</span>
      </MenuItem>
    </Menu>
  );
};

function selectProfile(key: Key) {
  switch (key) {
    case 'options':
      return chrome.runtime.openOptionsPage();
    case 'direct':
    case 'system': {
      chrome.proxy.settings.set(
        {
          value: {
            mode: key,
          } satisfies chrome.proxy.ProxyConfig,
        },
        () => {
          chrome.tabs.reload();
        }
      );
      break;
    }
    default:
  }
}
