import {Flex} from 'antd';
import {ToolbarMenu} from './menu/ToolbarMenu';

export const ToolbarRight = () => {
    return (
        <Flex align="center" gap={8}>
            <ToolbarMenu />
        </Flex>
    );
};
