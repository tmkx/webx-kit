import React from 'react';
import { AndroidOutlined, AppleOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';

export function App() {
  return (
    <Tabs
      defaultActiveKey="2"
      items={[AppleOutlined, AndroidOutlined].map((Icon, i) => {
        const id = String(i + 1);
        return {
          key: id,
          label: <div data-testid={`tab-${id}`}>{`Tab ${id}`}</div>,
          children: <div data-testid={`content-${id}`}>{`Tab ${id}`}</div>,
          icon: <Icon />,
        };
      })}
    />
  );
}
