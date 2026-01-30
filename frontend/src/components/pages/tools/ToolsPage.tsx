import {Flex} from 'antd';
import {CandidToVec8} from './CandidToVec8';

export const ToolsPage = () => {
    return (
        <Flex vertical gap={32}>
            <CandidToVec8 />
        </Flex>
    );
};
