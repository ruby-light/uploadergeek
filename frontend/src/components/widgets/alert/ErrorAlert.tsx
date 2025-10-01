import type {ComponentProps} from 'react';
import {AbstractAlertWithAction} from './AbstractAlertWithAction';

export const ErrorAlert = (props: Omit<ComponentProps<typeof AbstractAlertWithAction>, 'type' | 'action'>) => {
    return <AbstractAlertWithAction {...props} type="error" />;
};
