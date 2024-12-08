import { ThunderboltFilled } from '@ant-design/icons';
import { FloatButton, Modal } from 'antd';
import { useState } from 'react';

export function App() {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <FloatButton
        shape="circle"
        type="primary"
        icon={<ThunderboltFilled />}
        tooltip="WebX Kit"
        onClick={() => setVisible(true)}
      />
      <Modal title="Settings" open={visible} footer={null} onCancel={() => setVisible(false)}>
        <Settings />
      </Modal>
    </>
  );
}

function Settings() {
  return <div data-testid="settings">Content</div>;
}
