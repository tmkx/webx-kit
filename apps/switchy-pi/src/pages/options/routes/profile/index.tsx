import { useNavigate, useParams } from 'react-router-dom';
import { DownloadIcon, FilePenLineIcon, TrashIcon } from 'lucide-react';
import { AlertDialog, Button, Dialog, Modal, TextField, Toolbar } from '@/components';
import { DialogTrigger, Form, Heading } from 'react-aria-components';
import { useDeleteProfile, useProfile } from '@/hooks';
import type { FixedProfile, Profile as ProfileType } from '@/schemas';
import { NormalLayout } from '../layout';
import { FixedServers } from './fixed-servers';
import { generatePACFromFixedProfile } from '@/utils/pac';
import { downloadTextAsFile } from '@/utils/misc';

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
          <ExportProfile profile={profile} />
          <RenameProfile profile={profile} onProfileChange={setProfile} />
          <DeleteProfile profileId={profileId} profile={profile} />
        </Toolbar>
      }
    >
      <FixedServers
        className="pb-4"
        profile={profile as FixedProfile}
        onSave={(newProfile) => {
          console.log(newProfile);
          setProfile(newProfile);
        }}
      />
    </NormalLayout>
  );
}

function ExportProfile({ profile }: { profile: ProfileType }) {
  const handleExport = () => {
    if (profile.profileType !== 'FixedProfile') return;
    const pacContent = generatePACFromFixedProfile(profile);
    downloadTextAsFile(pacContent, `SwitchyPiProfile_${profile.name}.pac`);
  };
  return (
    <Button variant="secondary" onPress={handleExport}>
      <DownloadIcon size={16} />
      Export PAC
    </Button>
  );
}

function RenameProfile({
  profile,
  onProfileChange,
}: {
  profile: ProfileType;
  onProfileChange: (profile: ProfileType) => Promise<void>;
}) {
  return (
    <DialogTrigger>
      <Button variant="secondary">
        <FilePenLineIcon size={16} />
        Rename
      </Button>
      <Modal isDismissable>
        <Dialog>
          {({ close }) => (
            <Form
              onSubmit={(ev: React.FormEvent<HTMLFormElement>) => {
                ev.preventDefault();
                const { name } = Object.fromEntries(new FormData(ev.currentTarget));
                onProfileChange({ ...profile, name: String(name) }).then(close);
              }}
            >
              <Heading slot="title" className="text-xl font-semibold leading-6 my-0">
                Rename Profile
              </Heading>
              <TextField
                className="mt-4"
                name="name"
                label="New profile name"
                autoFocus
                isRequired
                defaultValue={profile.name}
              />
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onPress={close}>
                  Cancel
                </Button>
                <Button type="submit">Rename</Button>
              </div>
            </Form>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}

function DeleteProfile({ profileId, profile }: { profileId: string; profile: ProfileType }) {
  const navigate = useNavigate();
  const deleteProfile = useDeleteProfile();

  const handleDelete = async () => {
    deleteProfile(profileId).then((nearestId) => {
      if (nearestId) navigate(`/profiles/${nearestId}`);
      else navigate('/ui');
    });
  };

  return (
    <DialogTrigger>
      <Button variant="destructive">
        <TrashIcon size={16} />
        Delete
      </Button>
      <Modal isDismissable>
        <AlertDialog variant="destructive" title="Delete Profile" actionLabel="Delete" onAction={handleDelete}>
          {`Are you sure you want to delete "${profile.name}"? All contents will be permanently destroyed.`}
        </AlertDialog>
      </Modal>
    </DialogTrigger>
  );
}
