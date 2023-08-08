import * as React from "react";
import {PropsWithChildren, useCallback, useEffect} from "react";
import _ from "lodash"
import {allKnownCanisterIds, Canisters} from "src/ic/canisters";
import {ActorSubclass} from "@dfinity/agent";
import {AuthProvider, AuthSourceProvider, InfinityWalletAuthProvider, InternetIdentityAuthProvider, InternetIdentityAuthProviderContext, NFIDInternetIdentityAuthProviderContext, PlugAuthProvider, StoicAuthProvider, useAuthProviderContext} from "geekfactory-ic-js-auth";
import {Layout, Spin} from "antd";
import {AppThemeProvider} from "src/components/sys/theme/AppThemeProvider";
import {AnonymousLoginPage} from "src/components/anonymous/AnonymousLoginPage";
import {ActorsProvider} from "src/components/data/ActorsProvider";
import {LoggedInWelcomeWrapper} from "src/components/loggedIn/LoggedInWelcomeWrapper";
import {GovernanceDataProvider} from "src/components/data/GovernanceDataProvider";
import {CurrentGovernanceProvider} from "src/components/loggedIn/CurrentGovernanceProvider";
import {EntryPoint} from "src/components/loggedIn/EntryPoint";
const {Header, Footer, Sider, Content} = Layout;

export const actorsByCanisterId: { [key: string]: ActorSubclass | undefined } = {}
const clearActorsByCanisterId = () => {
    _.each(_.keys(actorsByCanisterId), key => {
        delete actorsByCanisterId[key]
    })
}
const AuthComponents = (props: PropsWithChildren<any>) => {
    const onLogout = useCallback(() => {
        clearActorsByCanisterId()
    }, [])
    const whitelist: Array<string> = _.cloneDeep(allKnownCanisterIds)
    return <AuthSourceProvider storeNamespace={"identitygeek--auth--"}>
        <InternetIdentityAuthProvider source={"II"} context={InternetIdentityAuthProviderContext}>
            <InternetIdentityAuthProvider source={"NFID"} context={NFIDInternetIdentityAuthProviderContext}>
                <PlugAuthProvider whitelist={whitelist} autologinTimeout={10000}>
                    <StoicAuthProvider>
                        <InfinityWalletAuthProvider whitelist={whitelist}>
                            <AuthProvider onLogout={onLogout}>
                                {props.children}
                            </AuthProvider>
                        </InfinityWalletAuthProvider>
                    </StoicAuthProvider>
                </PlugAuthProvider>
            </InternetIdentityAuthProvider>
        </InternetIdentityAuthProvider>
    </AuthSourceProvider>
}

const AppAuthSwitch = () => {
    const authProviderContext = useAuthProviderContext();

    const isReady = authProviderContext.status.isReady
    const isLoggedIn = authProviderContext.status.isLoggedIn;
    const source = authProviderContext.source;

    useEffect(() => {
        if (isReady) {
            if (isLoggedIn) {
                if (!!process.env.IS_TEST_SERVER) {
                    const currentPrincipal = authProviderContext.getCurrentPrincipal();
                    console.log("User is logged in: ", source, currentPrincipal?.toText(), currentPrincipal)
                }
            }
        }
    }, [isLoggedIn, isReady, source])

    if (!isReady) {
        return <Spin/>
        // return <SkeletonComponent toolbarComponent={ToolbarComponent} contentComponent={PageLoaderComponent} footerComponent={Footer}/>
    }

    if (!isLoggedIn) {
        return <AnonymousLoginPage/>
    }

    return <>
        <LoggedInWelcomeWrapper>
            <GovernanceDataProvider>
                <CurrentGovernanceProvider>
                    <EntryPoint/>
                </CurrentGovernanceProvider>
            </GovernanceDataProvider>
        </LoggedInWelcomeWrapper>
    </>
    // return <SkeletonComponent toolbarComponent={ToolbarComponent} contentComponent={RootContentComponent} footerComponent={Footer} bannerComponent={BannerComponent}/>
}

export const App = () => {
    useEffect(() => {
        if (window.location.host === `${Canisters.frontend}.ic0.app`) {
            const hostToRedirect = `https://${Canisters.frontend}.raw.ic0.app`
            window.location.assign(hostToRedirect)
        }
        if (window.location.host === `${Canisters.frontend}.icp0.io`) {
            const hostToRedirect = `https://${Canisters.frontend}.raw.icp0.io`
            window.location.assign(hostToRedirect)
        }
    }, [window.location.host])

    useEffect(() => {
        if (!!process.env.IS_TEST_SERVER) {
            let label = process.env.NODE_ENV === "development" ? "** LOCAL **" : "** PROD DEBUG UI **"
            if (!!process.env.TEST_ENV_UI_SERVER) {
                label = "** TEST UI **"
            }
            window.document.title = `${label} ${window.document.title}`
        }
    }, [])

    return <>
        <AuthComponents>
            <AppThemeProvider>
                <ActorsProvider>
                    <AppAuthSwitch/>
                </ActorsProvider>
            </AppThemeProvider>
        </AuthComponents>
    </>
}