import {MenuOutlined} from '@ant-design/icons';
import type {DropdownProps, MenuProps} from 'antd';
import {Button, Dropdown, Flex, Modal, Switch} from 'antd';
import type {SwitchClickEventHandler} from 'antd/es/switch';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {useMediaTheme} from 'frontend/src/context/mediaTheme/MediaThemeProvider';
import {i18} from 'frontend/src/i18';
import type {MenuInfo} from 'rc-menu/lib/interface';
import {useCallback, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {PATH_GOVERNANCE, PATH_HOME, PATH_PROFILE} from '../../../Router';

const menuSignOutKey = 'signOut';
const menuDarkModeKey = 'darkMode';

export const ToolbarMenu = () => {
    const {logout, isAuthenticated} = useAuthContext();
    const [disconnectModal, disconnectModalContextHolder] = Modal.useModal();
    const {toggleTheme} = useMediaTheme();

    const [open, setOpen] = useState(false);

    const handleSignOut = useCallback(() => {
        disconnectModal.confirm({
            open: true,
            title: i18.auth.disconnect.confirmationModal.title,
            icon: null,
            content: i18.auth.disconnect.confirmationModal.description,
            onOk: logout,
            okText: i18.auth.disconnect.confirmationModal.button,
            okButtonProps: {
                danger: true,
                className: 'gf-flex-auto'
            },
            cancelButtonProps: {className: 'gf-flex-auto'},
            autoFocusButton: null,
            closable: false,
            maskClosable: false,
            keyboard: false
        });
    }, [logout, disconnectModal]);

    const handleMenuClick: MenuProps['onClick'] = useCallback(
        (info: MenuInfo) => {
            switch (info.key) {
                case menuSignOutKey: {
                    handleSignOut();
                    setOpen(false);
                    break;
                }
                case menuDarkModeKey: {
                    toggleTheme();
                    break;
                }
                default: {
                    setOpen(false);
                }
            }
        },
        [handleSignOut, toggleTheme]
    );

    const handleOpenChange: DropdownProps['onOpenChange'] = (nextOpen, info) => {
        if (info.source == 'trigger' || nextOpen) {
            setOpen(nextOpen);
        }
    };

    const items = useMemo<MenuProps['items']>(() => {
        if (isAuthenticated) {
            return [
                {
                    key: 'home',
                    label: <Link to={PATH_HOME}>{i18.toolbar.menu.home}</Link>
                },
                {
                    key: 'governance',
                    label: <Link to={PATH_GOVERNANCE}>{i18.toolbar.menu.governance}</Link>
                },
                {
                    key: 'profile',
                    label: <Link to={PATH_PROFILE}>{i18.toolbar.menu.profile}</Link>
                },
                {type: 'divider'},
                {key: menuDarkModeKey, label: <DarkMode />},
                {type: 'divider'},
                {
                    key: menuSignOutKey,
                    label: i18.auth.disconnect.button,
                    danger: true
                }
            ] satisfies MenuProps['items'];
        }
        return [
            {
                key: 'home',
                label: <Link to={PATH_HOME}>{i18.toolbar.menu.home}</Link>
            },
            {type: 'divider'},
            {key: menuDarkModeKey, label: <DarkMode />}
        ] satisfies MenuProps['items'];
    }, [isAuthenticated]);

    return (
        <>
            <Dropdown menu={{items, style: {minWidth: '200px'}, onClick: handleMenuClick}} placement="bottomRight" trigger={['click']} open={open} onOpenChange={handleOpenChange}>
                <Button icon={<MenuOutlined />} type="text" />
            </Dropdown>
            {disconnectModalContextHolder}
        </>
    );
};

const DarkMode = () => {
    const {resolvedTheme, toggleTheme} = useMediaTheme();
    const checked = resolvedTheme == 'dark';

    const onClick: SwitchClickEventHandler = useCallback(
        (_checked, event) => {
            event.stopPropagation();
            event.preventDefault();
            toggleTheme();
            return false;
        },
        [toggleTheme]
    );

    return (
        <Flex gap={8} align="center" justify="space-between">
            <span>{i18.toolbar.menu.darkMode}</span>
            <Switch checked={checked} onClick={onClick} size="small" />
        </Flex>
    );
};
