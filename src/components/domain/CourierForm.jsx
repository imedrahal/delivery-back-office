import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { EMPTY_COURIER, hasErrors, validateCourier, VEHICLES } from '../../domain/couriers.js';
import { errorCode } from '../../domain/errors.js';
import { enumOptions } from '../../i18n/labels.js';

/** Presentational form: validation is the pure `validateCourier`, persistence is injected via onSubmit. */
export default function CourierForm({ onSubmit, onCancel }) {
  const { t } = useI18n();
  const [values, setValues] = useState(EMPTY_COURIER);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState(null);
  const errors = submitted ? validateCourier(values) : {};
  const set = (key) => (event) => setValues((v) => ({ ...v, [key]: event.target.value }));
  const msg = (key) => (errors[key] ? t(`error.${errors[key]}`) : undefined);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors(validateCourier(values))) return;
    setBusy(true);
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setServerError(errorCode(err));
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <Field label={t('field.name')} error={msg('display_name')}>
        <input value={values.display_name} onChange={set('display_name')} placeholder={t('courier.placeholderName')} autoFocus />
      </Field>
      <div className="form__row">
        <Field label={t('field.phone')} error={msg('phone')}>
          <input value={values.phone} onChange={set('phone')} inputMode="tel" placeholder="+216 20 000 000" dir="ltr" />
        </Field>
        <Field label={t('field.email')} error={msg('email')}>
          <input type="email" value={values.email} onChange={set('email')} dir="ltr" />
        </Field>
      </div>
      <div className="form__row">
        <Field label={t('field.vehicle')}>
          <select value={values.vehicle} onChange={set('vehicle')}>
            {enumOptions(t, 'vehicle', VEHICLES).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label={t('field.zone')} error={msg('zone')}>
          <input value={values.zone} onChange={set('zone')} />
        </Field>
      </div>
      {serverError && <p className="field__error" role="alert">{t(`error.${serverError}`)}</p>}
      <div className="form__actions">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={busy}>{busy ? t('courier.saving') : t('courier.create')}</Button>
      </div>
    </form>
  );
}
