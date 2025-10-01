import {type ComponentProps} from 'react';
import {AbstractAlertWithAction} from './AbstractAlertWithAction';

export const ErrorAlertWithAction = (props: Omit<ComponentProps<typeof AbstractAlertWithAction>, 'type'>) => {
    return <AbstractAlertWithAction {...props} type="error" />;
};
