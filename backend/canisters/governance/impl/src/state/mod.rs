use crate::model::DataModel;

pub struct CanisterState {
    pub model: DataModel,
}

impl CanisterState {
    pub fn new(model: DataModel) -> Self {
        Self { model }
    }

    pub fn caller_is_geek_user(&self) -> bool {
        self.model.geek_user_storage.is_geek_user(&ic_cdk::caller())
    }

    pub fn caller_is_governance_user(&self) -> bool {
        self.model
            .governance_storage
            .get_governance_participant(&ic_cdk::caller())
            .is_some()
    }
}
