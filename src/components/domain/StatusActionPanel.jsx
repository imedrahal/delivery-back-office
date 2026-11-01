import { useState } from 'react';
import Button from '../ui/Button.jsx';
import ReasonDialog from './ReasonDialog.jsx';
import { DANGER_TARGETS } from '../../domain/constants.js';
import { allowedTargets, requiresDecisionNote } from '../../domain/transitions.js';
import { useI18n } from '../../context/I18nContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * Generic, entity-agnostic admin action bar.
 * `submit(to, form)` is injected by the page (it knows which service to call).
 */
export default function StatusActionPanel({ entity, status, submit, onDone }) {
  const { t } = useI18n();
  const { notify } = useToast();
  const [target, setTarget] = useState(null);
  const targets = allowedTargets(entity, status);

  if (targets.length === 0) return <p className="muted">{t('actions.none')}</p>;

  const variantFor = (to) => (DANGER_TARGETS.includes(to) ? 'danger' : 'primary');
  const handleSubmit = async (form) => {
    const updated = await submit(target, form);
    setTarget(null);
    notify(t('toast.updated'));
    onDone(updated);
  };

  return (
    <>
      <div className="row">
        {targets.map((to) => (
          <Button key={to} variant={DANGER_TARGETS.includes(to) ? 'danger-outline' : 'primary-outline'} onClick={() => setTarget(to)}>
            {t(`actionLabel.${to}`)}
          </Button>
        ))}
      </div>
      {target && (
        <ReasonDialog actionLabel={t(`actionLabel.${target}`)} needsNote={requiresDecisionNote(entity, target)}
          variant={variantFor(target)} onCancel={() => setTarget(null)} onSubmit={handleSubmit} />
      )}
    </>
  );
}
