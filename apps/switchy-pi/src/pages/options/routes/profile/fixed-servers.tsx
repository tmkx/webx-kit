import { useEffect, useMemo } from 'react';
import { Form, TableBody } from 'react-aria-components';
import { Control, Controller, useController, useForm } from 'react-hook-form';
import {
  Button,
  Cell,
  Column,
  NumberField,
  Row,
  Select,
  SelectItem,
  SelectProps,
  Table,
  TableHeader,
  TextField,
  Toolbar,
  TextAreaField,
} from '@/components';
import { FixedProfile } from '@/schemas';

interface FixedServersProps {
  className?: string;
  profile: FixedProfile;
  onSave: (values: FixedProfile) => void;
}

export function FixedServers({ className, profile, onSave }: FixedServersProps) {
  return (
    <div className={className}>
      <div>
        <h2 className="text-2xl">Proxy Servers</h2>
        <ProxyServerForm
          className="m-4"
          profile={profile}
          onSubmit={(formValues) => {
            onSave({ ...profile, ...computeProxyRulesFromFormValues(formValues) });
          }}
        />
      </div>
      <div>
        <h2 className="text-2xl">Bypass List</h2>
        <ProxyBypassForm className="m-4" profile={profile} onSubmit={onSave} />
      </div>
    </div>
  );
}

const defaultValues = {
  fallbackProxy: { scheme: chrome.proxy.Scheme.HTTP, host: 'example.com', port: 80 },
  proxyForHttp: { scheme: undefined, host: 'example.com', port: 80 },
  proxyForHttps: { scheme: undefined, host: 'example.com', port: 80 },
  proxyForFtp: { scheme: undefined, host: 'example.com', port: 80 },
} as FixedProfile;

const advancedSchemes = ['proxyForHttp', 'proxyForHttps', 'proxyForFtp'] as const;

interface ProxyServerFormProps {
  className?: string;
  profile: FixedProfile;
  onSubmit: (formValues: Partial<FixedProfile>, ev?: React.BaseSyntheticEvent) => void;
}

function ProxyServerForm({ className, profile, onSubmit }: ProxyServerFormProps) {
  const { control, handleSubmit, setValue } = useForm({
    defaultValues,
  });

  useEffect(() => {
    (Object.keys(defaultValues) as (keyof typeof defaultValues)[]).forEach((field) => {
      setValue(field, profile[field] || defaultValues[field]);
    });
  }, [profile]);

  const { field: defaultProtocolField } = useController({ control, name: 'fallbackProxy.scheme' });
  const isDirect = defaultProtocolField.value == null;

  return (
    <Form className={className} onSubmit={handleSubmit(onSubmit)}>
      <Table aria-label="Proxy config">
        <TableHeader>
          <Column minWidth={100} maxWidth={130} isRowHeader>
            Scheme
          </Column>
          <Column minWidth={180}>Protocol</Column>
          <Column minWidth={200}>Server</Column>
          <Column minWidth={100}>Port</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell className="font-mono">(default)</Cell>
            <Cell>
              <ProtocolSelect
                name={defaultProtocolField.name}
                selectedKey={defaultProtocolField.value}
                onSelectionChange={defaultProtocolField.onChange}
              />
            </Cell>
            <Cell>
              <Controller
                control={control}
                name="fallbackProxy.host"
                render={({ field }) => (
                  <TextField
                    name={field.name}
                    aria-label="Proxy server"
                    isRequired
                    isDisabled={isDirect}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Cell>
            <Cell>
              <Controller
                control={control}
                name="fallbackProxy.port"
                render={({ field }) => (
                  <NumberField
                    name={field.name}
                    aria-label="Port"
                    minValue={0}
                    maxValue={65535}
                    formatOptions={{ useGrouping: false }}
                    isDisabled={isDirect}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Cell>
          </Row>
          {advancedSchemes.map((scheme) => (
            <AdvancedSchemeRow key={scheme} control={control} scheme={scheme} />
          ))}
        </TableBody>
      </Table>
      <Toolbar className="mt-2 justify-end">
        <Button type="reset" variant="secondary">
          Reset
        </Button>
        <Button type="submit">Save</Button>
      </Toolbar>
    </Form>
  );
}
interface ProxyProxyFormProps {
  className?: string;
  profile: FixedProfile;
  onSubmit: (formValues: FixedProfile, ev?: React.BaseSyntheticEvent) => void;
}

function ProxyBypassForm({ className, profile, onSubmit }: ProxyProxyFormProps) {
  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const { bypassList } = Object.fromEntries(new FormData(ev.currentTarget));
    onSubmit(
      {
        ...profile,
        bypassList: String(bypassList)
          .split('\n')
          .map((row) => row.trim())
          .filter((row) => row)
          .map((row) => ({ conditionType: '', pattern: row })),
      },
      ev
    );
  };

  const defaultValue = useMemo(() => profile.bypassList.map((item) => item.pattern).join('\n'), [profile]);

  return (
    <Form className={className} onSubmit={handleSubmit}>
      <TextAreaField
        className="font-mono"
        name="bypassList"
        aria-label="Bypass list"
        rows={10}
        defaultValue={defaultValue}
      />
      <Toolbar className="mt-2 justify-end">
        <Button type="reset" variant="secondary">
          Reset
        </Button>
        <Button type="submit">Save</Button>
      </Toolbar>
    </Form>
  );
}

function AdvancedSchemeRow({
  control,
  scheme,
}: {
  control: Control<FixedProfile>;
  scheme: (typeof advancedSchemes)[number];
}) {
  const { field: protocolField } = useController({ control, name: `${scheme}.scheme` });
  const isInheritDefault = protocolField.value != null;
  return (
    <Row>
      <Cell className="font-mono">{`${scheme.replace('proxyFor', '').toLowerCase()}://`}</Cell>
      <Cell>
        <ProtocolSelect
          name={protocolField.name}
          isAdvanced
          value={protocolField.value}
          onChange={protocolField.onChange}
        />
      </Cell>
      <Cell>
        <Controller
          control={control}
          name={`${scheme}.host`}
          render={({ field }) => (
            <TextField
              name={field.name}
              aria-label="Proxy server"
              isRequired
              isDisabled={isInheritDefault}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Cell>
      <Cell>
        <Controller
          control={control}
          name={`${scheme}.port`}
          render={({ field }) => (
            <NumberField
              name={field.name}
              aria-label="Port"
              minValue={0}
              maxValue={65535}
              formatOptions={{ useGrouping: false }}
              isDisabled={isInheritDefault}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Cell>
    </Row>
  );
}

function ProtocolSelect<T extends object>({
  isAdvanced,
  ...props
}: Omit<SelectProps<T>, 'children'> & {
  isAdvanced?: boolean;
}) {
  return (
    <Select {...props} aria-label="Protocol">
      {isAdvanced ? <SelectItem id="DEFAULT">(use default)</SelectItem> : <SelectItem id="DIRECT">DIRECT</SelectItem>}
      <SelectItem id="http">HTTP</SelectItem>
      <SelectItem id="https">HTTPS</SelectItem>
      <SelectItem id="socks4">SOCKS4</SelectItem>
      <SelectItem id="socks5">SOCKS5</SelectItem>
    </Select>
  );
}

export function computeProxyRulesFromFormValues(
  formValues: Partial<FixedProfile>
): Omit<chrome.proxy.ProxyRules, 'bypassList'> {
  const { fallbackProxy, proxyForHttp, proxyForHttps, proxyForFtp } = formValues;
  const rules: chrome.proxy.ProxyRules = {};
  if ([proxyForHttp, proxyForHttps, proxyForFtp].some((type) => type && !type.scheme)) {
    rules.fallbackProxy = fallbackProxy;
  }
  if (proxyForHttp && proxyForHttp.scheme) rules.proxyForHttp = proxyForHttp;
  if (proxyForFtp && proxyForFtp.scheme) rules.proxyForHttps = proxyForFtp;
  if (proxyForFtp && proxyForFtp.scheme) rules.proxyForFtp = proxyForFtp;
  return rules;
}
