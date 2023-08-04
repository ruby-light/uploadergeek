pub fn caller_is_service_principal() -> Result<(), String> {
    if crate::read_state(|state| state.caller_is_service_principal()) {
        Ok(())
    } else {
        Err("Caller is not service principal".to_owned())
    }
}

pub fn caller_is_geek_user() -> Result<(), String> {
    if crate::read_state(|state| state.caller_is_geek_user()) {
        Ok(())
    } else {
        Err("Caller is not geek user".to_owned())
    }
}

pub fn caller_is_operator() -> Result<(), String> {
    if crate::read_state(|state| state.caller_is_operator()) {
        Ok(())
    } else {
        Err("Caller is not operator".to_owned())
    }
}
