import {Flex, Input} from 'antd';
import {PanelCard} from '../../widgets/PanelCard';
import {PanelHeader} from '../../widgets/PanelHeader';

export const CandidToVec8 = () => {
    return (
        <PanelCard>
            <Flex vertical gap={32}>
                <PanelHeader title="Candid to Vec8" />
                <Input.TextArea rows={3} placeholder="Enter Candid value here..." />
            </Flex>
        </PanelCard>
    );
};

// function candidEncodeFromStrings(typeStr: string, valueStr: string): Uint8Array {
//     // 1. Парсим тип из строки
//     const parsedType = IDL.parse(typeStr);

//     // 2. Парсим значение из строки
//     const value = IDL.parseValue(valueStr, [parsedType]);

//     // 3. Кодируем значение в Candid бинарь
//     const bytes = IDL.encode([parsedType], [value]);

//     return new Uint8Array(bytes);
// }
