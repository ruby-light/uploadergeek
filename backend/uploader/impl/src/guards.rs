pub fn caller_is_service_principal() -> Result<(), String> {
    if crate::read_state(|state| state.is_caller_is_service_principal()) {
        Ok(())
    } else {
        Err("Caller is not service principal".to_owned())
    }
}
