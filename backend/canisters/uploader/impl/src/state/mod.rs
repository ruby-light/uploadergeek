use ic_cdk::api::msg_caller;

use crate::model::DataModel;

pub struct CanisterState {
    pub model: DataModel,
}

impl CanisterState {
    pub fn new(model: DataModel) -> Self {
        Self { model }
    }

    pub fn caller_is_service_principal(&self) -> bool {
        self.model.is_service_principal(&msg_caller())
    }

    pub fn caller_is_geek_user(&self) -> bool {
        self.model.is_geek_user(&msg_caller())
    }

    pub fn caller_is_operator(&self) -> bool {
        self.model.is_operator(&msg_caller())
    }
}
