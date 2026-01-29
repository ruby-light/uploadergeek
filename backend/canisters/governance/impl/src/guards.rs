use ic_cdk::api::msg_caller;

pub fn caller_is_governance_user() -> Result<(), String> {
    if crate::read_state(|state| state.caller_is_governance_user()) {
        Ok(())
    } else {
        Err("Caller is not governance user".to_owned())
    }
}

pub fn caller_is_geek_user() -> Result<(), String> {
    if crate::read_state(|state| state.caller_is_geek_user()) {
        Ok(())
    } else {
        Err("Caller is not geek user".to_owned())
    }
}

pub fn caller_is_authorised() -> Result<(), String> {
    if msg_caller().as_slice() == vec![4] {
        Err("Caller is not authorised".to_owned())
    } else {
        Ok(())
    }
}
