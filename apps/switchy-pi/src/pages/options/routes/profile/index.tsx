import { useParams } from 'react-router-dom';
import { DownloadIcon, FilePenLineIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components';
import { NormalLayout } from '../layout';

interface ProfileRouteParams {
  [key: string]: string | undefined;
  id?: string;
}

export function Profile() {
  const params = useParams<ProfileRouteParams>();
  return (
    <NormalLayout
      title={
        <div className="flex gap-2">
          <input className="w-8 h-8 rounded-lg" type="color" defaultValue="#abcdef" />
          <div>{`Profile: ${params.id}`}</div>
        </div>
      }
      action={
        <div className="flex gap-1">
          <Button variant="secondary" icon={<DownloadIcon size={16} />}>
            Export PAC
          </Button>
          <Button variant="secondary" icon={<FilePenLineIcon size={16} />}>
            Rename
          </Button>
          <Button variant="destructive" icon={<TrashIcon size={16} />}>
            Delete
          </Button>
        </div>
      }
    >
      <pre>
        <code>{JSON.stringify(params, null, 2)}</code>
      </pre>
    </NormalLayout>
  );
}
