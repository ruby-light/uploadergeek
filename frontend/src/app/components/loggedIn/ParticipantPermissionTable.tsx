import {Flex, Tag} from 'antd';
import {KeyValueHorizontal} from 'frontend/src/components/widgets/KeyValueHorizontal';
import type {KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';

import {useMemo} from 'react';
import type {ProposalPermission, ProposalType} from 'src/declarations/governance/governance.did';

type Props = {
    proposalPermissions: Array<[ProposalType, Array<ProposalPermission>]>;
};

type TableItemType = {
    proposalType: KeysOfUnion<ProposalType>;
    proposalPermissions: Array<KeysOfUnion<ProposalPermission>>;
};

export const ParticipantPermissions = (props: Props) => {
    const {proposalPermissions} = props;

    const dataSource: Array<TableItemType> = useMemo(() => {
        return proposalPermissions.map(([proposalType, proposalPermissions]) => {
            return {
                proposalType: getICFirstKey(proposalType) as KeysOfUnion<ProposalType>,
                proposalPermissions: proposalPermissions.map<KeysOfUnion<ProposalPermission>>((proposalPermission) => {
                    return getICFirstKey(proposalPermission) as KeysOfUnion<ProposalPermission>;
                })
            };
        });
    }, [proposalPermissions]);

    return (
        <>
            {dataSource.map((value, index) => {
                return (
                    <KeyValueHorizontal
                        key={index}
                        label={value.proposalType}
                        value={
                            <Flex gap={8}>
                                {value.proposalPermissions.map((v, idx) => (
                                    <Tag key={idx}>{v}</Tag>
                                ))}
                            </Flex>
                        }
                    />
                );
            })}
        </>
    );
};
