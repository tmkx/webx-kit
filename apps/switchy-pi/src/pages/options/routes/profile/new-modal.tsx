import React from 'react';
import { useStore } from 'jotai';
import { DialogTrigger, DialogTriggerProps, Form, Heading } from 'react-aria-components';
import { Button, Dialog, Label, Modal, Radio, RadioGroup, TextField } from '@/components';
import { profileIcons } from './shared';
import { profileFamily, profileListAtom } from '@/atoms/profile';
import { createDefaultProfile } from '@/schemas';
import { createElement } from 'react';

interface NewProfileModalProps extends Pick<DialogTriggerProps, 'isOpen' | 'onOpenChange'> {
  onCreate?: (profileId: string) => void;
}

export function NewProfileModal({ isOpen, onOpenChange, onCreate }: NewProfileModalProps) {
  const store = useStore();

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const { name } = Object.fromEntries(new FormData(ev.currentTarget));

    const profileId = Math.random().toString(36).slice(2);
    await store.set(profileFamily(profileId), createDefaultProfile(String(name)));
    await store.set(profileListAtom, async profileList => [...(await profileList), profileId]);

    onCreate?.(profileId);
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal isDismissable>
        <Dialog>
          {({ close }) => (
            <Form onSubmit={handleSubmit}>
              <Heading slot="title" className="my-0 text-xl leading-6 font-semibold">
                New Profile
              </Heading>
              <TextField className="mt-4" name="name" label="Profile name" autoFocus isRequired />
              <RadioGroup className="mt-2" name="type" defaultValue="FixedProfile" isRequired>
                <Label>Profile type</Label>
                <Radio value="FixedProfile">
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-1">
                      {createElement(profileIcons.FixedProfile, { size: 14 })}
                      <span>Proxy Profile</span>
                    </div>
                    <div className="opacity-80">Tunneling traffic through proxy servers.</div>
                  </div>
                </Radio>
              </RadioGroup>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onPress={close}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </Form>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
