import {Button} from 'antd';
import {i18} from 'frontend/src/i18';
import {useCallback, type ReactNode} from 'react';

type Props = {
    loading?: boolean;
    onClick?: () => void;
    label?: ReactNode;
};
export const AlertActionButton = (props: Props) => {
    const {loading, onClick, label = i18.common.button.retryButton} = props;

    const callback = useCallback(() => {
        onClick?.();
    }, [onClick]);

    return (
        <Button onClick={callback} type="link" size="small" loading={loading} disabled={loading} className="gf-underline gf-no-padding">
            {label}
        </Button>
    );
};
