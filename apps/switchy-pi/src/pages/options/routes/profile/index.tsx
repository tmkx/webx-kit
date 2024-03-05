import { useNavigate, useParams } from 'react-router-dom';
import { DownloadIcon, FilePenLineIcon, TrashIcon } from 'lucide-react';
import { AlertDialog, Button, Modal, Toolbar } from '@/components';
import { DialogTrigger } from 'react-aria-components';
import { useStore } from 'jotai';
import { RESET } from 'jotai/utils';
import { profileFamily, profileListAtom } from '@/atoms/profile';
import { useActiveProfileId, useProfile } from '@/hooks';
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
  const [activeProfileId, setActiveProfileId] = useActiveProfileId();
  const store = useStore();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!profile) return;
    await store.set(profileListAtom, async (list) => (await list).filter((item) => item !== profileId));
    await store.set(profileFamily(profileId), RESET);
    const profileList = await store.get(profileListAtom);
    if (profileId === activeProfileId) await setActiveProfileId('system');
    if (profileList[0]) navigate(`/profiles/${profileList[0]}`);
    else navigate('/ui');
  };

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
          <DialogTrigger>
            <Button variant="destructive" icon={<TrashIcon size={16} />}>
              Delete
            </Button>
            <Modal>
              <AlertDialog variant="destructive" title="Delete Profile" actionLabel="Delete" onAction={handleDelete}>
                {`Are you sure you want to delete "${profile.name}"? All contents will be permanently destroyed.`}
              </AlertDialog>
            </Modal>
          </DialogTrigger>
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
