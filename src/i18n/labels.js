/** t('status.X') helper that tolerates empty values. */
export const label = (t, prefix, value) => (value ? t(`${prefix}.${value}`) : t('common.none'));

/** Options for <select>/filters built from a list of enum values. */
export const enumOptions = (t, prefix, values) => values.map((value) => ({ value, label: t(`${prefix}.${value}`) }));
