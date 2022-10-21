use crate::model::DataModel;

pub struct CanisterState {
    pub model: DataModel,
}

impl CanisterState {
    pub fn new(model: DataModel) -> Self {
        Self { model }
    }

    pub fn is_caller_is_service_principal(&self) -> bool {
        self.model.is_service_principal(&ic_cdk::caller())
    }
}
