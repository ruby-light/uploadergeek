import {Typography} from 'antd';
import {i18} from 'frontend/src/i18';
import {Link} from 'react-router-dom';
import {PATH_HOME} from '../../Router';

export const Logo = () => {
    return (
        <Link to={PATH_HOME}>
            <Typography.Title level={4}>{i18.toolbar.title}</Typography.Title>
        </Link>
    );
};
