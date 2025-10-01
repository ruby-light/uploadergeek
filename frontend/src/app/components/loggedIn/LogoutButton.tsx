import {LogoutOutlined} from '@ant-design/icons';
import {Button, Popconfirm} from 'antd';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';

export const LogoutButton = () => {
    const {logout} = useAuthContext();
    return (
        <Popconfirm title="Are you sure to logout?" onConfirm={logout} onCancel={undefined} okText="Yes" cancelText="No">
            <Button icon={<LogoutOutlined />} size="small" />
        </Popconfirm>
    );
};
