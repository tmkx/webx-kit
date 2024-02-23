import { useParams } from 'react-router-dom';

export function Profile() {
  const params = useParams();
  return (
    <pre>
      <code>{JSON.stringify(params, null, 2)}</code>
    </pre>
  );
}
