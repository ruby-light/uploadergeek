import type {ComponentProps} from 'react';
import {AbstractAlertWithAction} from './AbstractAlertWithAction';

type Props = Omit<ComponentProps<typeof AbstractAlertWithAction>, 'type'>;

export const WarningAlertWithAction = (props: Props) => {
    return <AbstractAlertWithAction {...props} type="warning" />;
};
