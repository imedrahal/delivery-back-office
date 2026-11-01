import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { errorCode } from '../../domain/errors.js';
import { validateActionForm } from '../../domain/transitions.js';
import { useI18n } from '../../context/I18nContext.jsx';

/** Confirmation dialog collecting the mandatory reason (and decision note when required). */
export default function ReasonDialog({ actionLabel, needsNote, variant, onCancel, onSubmit }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ reason: '', note: '', isPublic: true });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => {
    const value = field === 'isPublic' ? event.target.checked : event.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateActionForm({ reason: form.reason, note: form.note, needsNote });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    setSubmitError(null);
    try {
      await onSubmit({ reason: form.reason.trim(), note: needsNote ? form.note : undefined, isInternalNote: !form.isPublic });
    } catch (error) {
      setSubmitError(errorCode(error));
      setBusy(false);
    }
  };

  return (
    <Modal open title={t('dialog.title', { action: actionLabel })} closeLabel={t('common.close')} onClose={onCancel}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>{t('dialog.reason')}</span>
          <textarea rows={3} value={form.reason} onChange={update('reason')} aria-invalid={!!errors.reason} />
          {errors.reason && <small className="field__error">{t(`error.${errors.reason}`)}</small>}
        </label>
        {needsNote && (
          <>
            <label className="field">
              <span>{t('dialog.note')}</span>
              <textarea rows={3} value={form.note} onChange={update('note')} aria-invalid={!!errors.note} />
              {errors.note && <small className="field__error">{t(`error.${errors.note}`)}</small>}
            </label>
            <label className="check">
              <input type="checkbox" checked={form.isPublic} onChange={update('isPublic')} />
              <span>{t('dialog.public')}</span>
            </label>
            <small className="muted">{t('dialog.internalHint')}</small>
          </>
        )}
        {submitError && <p className="field__error" role="alert">{t(`error.${submitError}`)}</p>}
        <div className="form__actions">
          <Button onClick={onCancel} disabled={busy}>{t('common.cancel')}</Button>
          <Button type="submit" variant={variant} disabled={busy}>{t('common.confirm')}</Button>
        </div>
      </form>
    </Modal>
  );
}
