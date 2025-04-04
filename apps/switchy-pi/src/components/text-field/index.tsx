import React from 'react';
import {
  TextField as AriaTextField,
  TextFieldProps as AriaTextFieldProps,
  TextAreaProps,
  ValidationResult,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { Description, FieldError, Input, Label, TextArea, fieldBorderStyles } from '../field';
import { composeTailwindRenderProps, focusRing } from '../shared/utils';

const inputStyles = tv({
  extend: focusRing,
  base: 'border-2 rounded-md',
  variants: {
    isFocused: fieldBorderStyles.variants.isFocusWithin,
    isInvalid: fieldBorderStyles.variants.isInvalid,
    isDisabled: fieldBorderStyles.variants.isDisabled,
  },
});

export interface TextFieldProps extends AriaTextFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

export function TextField({ label, description, errorMessage, ...props }: TextFieldProps) {
  return (
    <AriaTextField {...props} className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1')}>
      {label && <Label>{label}</Label>}
      <Input className={inputStyles} />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}

interface TextAreaFieldProps extends TextFieldProps, Pick<TextAreaProps, 'rows'> {}

export function TextAreaField({ label, description, errorMessage, rows, ...props }: TextAreaFieldProps) {
  return (
    <AriaTextField {...props} className={composeTailwindRenderProps(props.className, 'flex flex-col gap-1')}>
      {label && <Label>{label}</Label>}
      <TextArea className={inputStyles} rows={rows} />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
