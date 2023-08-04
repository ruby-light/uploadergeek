use candid::Principal;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Serialize, Deserialize, Default)]
pub struct GeekUserStorage {
    geek_user_principals: HashSet<Principal>,
}

impl GeekUserStorage {
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
}
