use candid::Principal;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use uploader_canister::types::OperationGrant;

#[derive(Serialize, Deserialize, Default)]
pub struct DataModel {
    service_principals: HashSet<Principal>,
    geek_user_principals: HashSet<Principal>,
    current_operation: Option<CurrentOperation>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct CurrentOperation {
    grant: OperationGrant,
    wasm_module: Vec<u8>,
}

impl DataModel {
    pub(crate) fn set_service_principals(&mut self, principals: Vec<Principal>) {
        self.service_principals.clear();
        self.service_principals.extend(principals);
    }

    pub(crate) fn get_service_principals(&self) -> &HashSet<Principal> {
        &self.service_principals
    }

    pub(crate) fn is_service_principal(&self, principal: &Principal) -> bool {
        self.service_principals.is_empty() || self.service_principals.contains(principal)
    }

    pub(crate) fn set_geek_user_principals(&mut self, principals: Vec<Principal>) {
        self.geek_user_principals.clear();
        self.geek_user_principals.extend(principals);
    }

    pub(crate) fn get_geek_user_principals(&self) -> &HashSet<Principal> {
        &self.geek_user_principals
    }

    pub(crate) fn is_geek_user(&self, principal: &Principal) -> bool {
        self.geek_user_principals.is_empty() || self.geek_user_principals.contains(principal)
    }

    pub(crate) fn set_operation_grant(&mut self, operation_grant: Option<OperationGrant>) {
        self.current_operation = operation_grant.map(|grant| CurrentOperation {
            grant,
            wasm_module: Vec::new(),
        });
    }

    pub(crate) fn get_operation_grant(&self) -> Option<&OperationGrant> {
        self.current_operation.as_ref().map(|op| &op.grant)
    }

    pub(crate) fn is_operator(&self, principal: &Principal) -> bool {
        self.current_operation
            .as_ref()
            .map(|operation| operation.grant.operator.eq(principal))
            .unwrap_or(false)
    }

    pub(crate) fn get_wasm_module(&mut self) -> &mut Vec<u8> {
        self.current_operation.as_mut().unwrap().wasm_module.as_mut()
    }
}
