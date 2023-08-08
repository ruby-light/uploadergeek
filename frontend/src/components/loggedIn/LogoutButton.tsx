import * as React from "react";
import {useAuthProviderContext} from "geekfactory-ic-js-auth";
import {Button, Popconfirm} from "antd";
import {LogoutOutlined} from "@ant-design/icons";

type Props = {}

export const LogoutButton = (props: Props) => {
    const authProviderContext = useAuthProviderContext();
    return <Popconfirm
        title="Are you sure to logout?"
        onConfirm={() => authProviderContext.logout(authProviderContext.source)}
        onCancel={undefined}
        okText="Yes"
        cancelText="No"
    ><Button icon={<LogoutOutlined/>} size={"small"}/></Popconfirm>
}