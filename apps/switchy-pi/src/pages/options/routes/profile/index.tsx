import { useParams } from 'react-router-dom';
import { DownloadIcon, FilePenLineIcon, TrashIcon } from 'lucide-react';
import { Button, Toolbar } from '@/components';
import { useProfile } from '@/hooks';
import type { FixedProfile } from '@/schemas';
import { NormalLayout } from '../layout';
import { FixedServers } from './fixed-servers';

interface ProfileRouteParams {
  [key: string]: string | undefined;
  id?: string;
}

export function Profile() {
  const params = useParams<ProfileRouteParams>();
  const profileId = params.id!;
  const [profile, setProfile] = useProfile(profileId);

  if (!profile) return <NormalLayout title={404}>Not Found</NormalLayout>;

  return (
    <NormalLayout
      title={
        <div className="flex gap-2">
          <input className="w-8 h-8 rounded-lg flex-shrink-0" type="color" defaultValue={profile.color} />
          <div>{`Profile: ${profile.name}`}</div>
        </div>
      }
      action={
        <Toolbar aria-label="Profile toolbar">
          <Button variant="secondary" icon={<DownloadIcon size={16} />}>
            Export PAC
          </Button>
          <Button variant="secondary" icon={<FilePenLineIcon size={16} />}>
            Rename
          </Button>
          <Button variant="destructive" icon={<TrashIcon size={16} />}>
            Delete
          </Button>
        </Toolbar>
      }
    >
      <FixedServers
        profile={profile as FixedProfile}
        onSave={(newProfile) => {
          console.log(newProfile);
          setProfile(newProfile);
        }}
      />
    </NormalLayout>
  );
}
