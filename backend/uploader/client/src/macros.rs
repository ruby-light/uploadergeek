#[macro_export]
macro_rules! generate_update_call {
    ($method_name:ident) => {
        pub async fn $method_name(
            agent: &ic_agent::Agent,
            canister_id: &candid::Principal,
            args: &$method_name::Args,
        ) -> Result<$method_name::Response, ic_agent::AgentError> {
            use candid::{Decode, Encode};

            let method_name = stringify!($method_name);
            let response = agent
                .update(canister_id, method_name)
                .with_arg(Encode!(args).expect(&format!("Failed to serialize '{}' args", method_name)))
                .call_and_wait()
                .await?;

            Ok(Decode!(response.as_slice(), $method_name::Response)
                .expect(&format!("Failed to deserialize '{}' response", method_name)))
        }
    };
}

#[macro_export]
macro_rules! generate_query_call {
    ($method_name:ident) => {
        pub async fn $method_name(
            agent: &ic_agent::Agent,
            canister_id: &candid::Principal,
            args: &$method_name::Args,
        ) -> Result<$method_name::Response, ic_agent::AgentError> {
            use candid::{Decode, Encode};

            let method_name = stringify!($method_name);
            let response = agent
                .query(canister_id, method_name)
                .with_arg(Encode!(args).expect(&format!("Failed to serialize '{}' args", method_name)))
                .call()
                .await?;

            Ok(Decode!(response.as_slice(), $method_name::Response)
                .expect(&format!("Failed to deserialize '{}' response", method_name)))
        }
    };
}
