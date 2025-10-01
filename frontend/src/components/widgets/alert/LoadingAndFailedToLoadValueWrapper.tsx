import {LoadingOutlined, ReloadOutlined} from '@ant-design/icons';
import {Button, Flex, Spin} from 'antd';
import {i18} from 'frontend/src/i18';
import {useCallback, type ReactNode} from 'react';

type Props = {
    children?: ReactNode;

    failedToLoadLabel?: ReactNode;

    loaded: boolean;
    isError: boolean;
    inProgress: boolean;
    action: () => void;
};
export const LoadingAndFailedToLoadValueWrapper = (props: Props) => {
    const {children, loaded, isError, inProgress, action, failedToLoadLabel = i18.common.error.keyValueFailedToLoad} = props;

    const onClick = useCallback(() => action(), [action]);

    if (!loaded) {
        return <Spin size="small" />;
    }
    if (isError) {
        const icon = inProgress ? <LoadingOutlined className="gf-ant-color-error" /> : <ReloadOutlined className="gf-ant-color-error" />;
        return (
            <Flex gap={4} className="gf-ant-color-error" align="center">
                <span>{failedToLoadLabel}</span>
                <Button icon={icon} type="link" size="small" className="gf-no-padding" onClick={onClick} disabled={inProgress} />
            </Flex>
        );
    }
    return children;
};
