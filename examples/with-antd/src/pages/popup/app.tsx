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
          label: `Tab ${id}`,
          children: `Tab ${id}`,
          icon: <Icon />,
        };
      })}
    />
  );
}
