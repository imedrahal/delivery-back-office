import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { errorCode } from '../../domain/errors.js';

const INITIAL_VALUES = {
  name: '',
  phone: '',
  city: '',
  vehicleType: '',
  vehicleDescription: '',
  capacity: '',
  description: '',
};

function validate(values, t) {
  const errors = {};
  if (values.name.trim().length < 2 || values.name.trim().length > 80) errors.name = t('transporter.validationName');
  if (!/^\+?[0-9 ]{8,15}$/.test(values.phone.trim())) errors.phone = t('transporter.validationPhone');
  if (values.city.trim().length > 60) errors.city = t('transporter.validationCity');
  if (values.vehicleType.trim().length < 2 || values.vehicleType.trim().length > 40) errors.vehicleType = t('transporter.validationVehicle');
  if (values.vehicleDescription.trim().length > 300) errors.vehicleDescription = t('transporter.validationVehicleDescription');
  if (values.capacity.trim().length > 80) errors.capacity = t('transporter.validationCapacity');
  if (values.description.trim().length > 1000) errors.description = t('transporter.validationDescription');
  return errors;
}

export default function TransporterForm({ onSubmit, onCancel }) {
  const { t } = useI18n();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(values, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setBusy(true);
    setServerError(null);
    try {
      await onSubmit({
        ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim() || null])),
        active: true,
      });
    } catch (error) {
      setServerError(errorCode(error));
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label={t('field.name')} error={errors.name}>
        <input autoFocus value={values.name} onChange={update('name')} maxLength={80} required />
      </Field>
      <div className="form__row">
        <Field label={t('field.phone')} error={errors.phone}>
          <input type="tel" inputMode="tel" dir="ltr" value={values.phone} onChange={update('phone')} required />
        </Field>
        <Field label={t('field.city')} error={errors.city}>
          <input value={values.city} onChange={update('city')} maxLength={60} />
        </Field>
      </div>
      <div className="form__row">
        <Field label={t('field.vehicle')} error={errors.vehicleType}>
          <input value={values.vehicleType} onChange={update('vehicleType')} maxLength={40} required />
        </Field>
        <Field label={t('field.capacity')} error={errors.capacity}>
          <input value={values.capacity} onChange={update('capacity')} maxLength={80} />
        </Field>
      </div>
      <Field label={t('field.vehicleDescription')} error={errors.vehicleDescription}>
        <input value={values.vehicleDescription} onChange={update('vehicleDescription')} maxLength={300} />
      </Field>
      <Field label={t('field.description')} error={errors.description}>
        <textarea value={values.description} onChange={update('description')} maxLength={1000} rows={3} />
      </Field>
      {serverError && <p className="field__error" role="alert">{t(`error.${serverError}`)}</p>}
      <div className="form__actions">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? t('transporter.saving') : t('transporter.create')}
        </Button>
      </div>
    </form>
  );
}
