use ic_cdk::export::Principal;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Serialize, Deserialize, Default)]
pub struct DataModel {
    service_principals: HashSet<Principal>,
    geek_user_principals: HashSet<Principal>,
    uploading_wasm: Option<Vec<u8>>,
    uploaded_wasm: Option<UploadedWasm>,
}

#[derive(Serialize, Deserialize, Default)]
pub struct UploadedWasm {
    pub wasm: Vec<u8>,
    pub hash: String,
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

    pub(crate) fn start_wasm_upload(&mut self) {
        self.uploading_wasm = Some(Vec::new());
        self.uploaded_wasm = None;
    }

    pub(crate) fn put_wasm_chunk(&mut self, chunk: Vec<u8>) {
        self.uploading_wasm.as_mut().unwrap().extend(chunk);
    }

    pub(crate) fn get_uploading_wasm(&self) -> Option<&Vec<u8>> {
        self.uploading_wasm.as_ref()
    }

    pub(crate) fn set_uploaded_wasm(&mut self, hash: String) {
        self.uploaded_wasm = Some(UploadedWasm {
            wasm: self.uploading_wasm.clone().unwrap(),
            hash,
        });
        self.uploading_wasm = None;
    }

    pub(crate) fn get_uploaded_wasm(&self) -> Option<&UploadedWasm> {
        self.uploaded_wasm.as_ref()
    }
}
