import type {AlertProps} from 'antd';
import {Alert} from 'antd';

export const AbstractAlertWithAction = (props: Omit<AlertProps, 'showIcon'> & {large?: boolean}) => {
    return <Alert {...props} showIcon={false} className={props.large ? 'gf-antd-alert-lg' : undefined} />;
};
