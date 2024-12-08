import { ThunderboltFilled } from '@ant-design/icons';
import { Button } from 'antd';

export const App = () => {
  return (
    <div className="fixed z-10 right-16 bottom-16">
      <Button
        className="text-sky-700 tabular-nums"
        icon={<ThunderboltFilled />}
        type="primary"
        shape="circle"
        size="large"
      />
    </div>
  );
};
