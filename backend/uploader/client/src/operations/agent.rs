use ic_agent::agent::http_transport::ReqwestHttpReplicaV2Transport;
use ic_agent::identity::{BasicIdentity, Secp256k1Identity};
use ic_agent::{Agent, Identity};
use k256::SecretKey;
use std::path::Path;

pub fn get_dfx_identity(name: &str) -> BasicIdentity {
    let home_dir = dirs::home_dir().expect("Failed to get home directory");
    let pem_file_path = home_dir.join(Path::new(&format!(".config/dfx/identity/{}/identity.pem", name)));
    BasicIdentity::from_pem_file(pem_file_path).expect("Failed to create identity")
}

pub fn get_secp256k1_identity(name: &str) -> Secp256k1Identity {
    let home_dir = dirs::home_dir().expect("Failed to get home directory");
    let pem_file_path = home_dir.join(Path::new(&format!(".config/dfx/identity/{}/identity.pem", name)));
    Secp256k1Identity::from_pem_file(pem_file_path).expect("Failed to create identity")
}

pub fn get_dfx_identity_from_pem_content(pem_content: Vec<u8>) -> Result<Box<dyn ic_agent::Identity>, String> {
    let pem = pem::parse(pem_content).map_err(|_| "Can not parse pem file".to_string())?;
    match pem.tag() {
        "EC PRIVATE KEY" => {
            let private_key = SecretKey::from_sec1_der(pem.contents()).map_err(|_| "can not obtain private key".to_string())?;
            Ok(Box::new(Secp256k1Identity::from_private_key(private_key)))
        }
        "PRIVATE KEY" => {
            let key_pair = ring::signature::Ed25519KeyPair::from_pkcs8(pem.contents())
                .map_err(|_| "can not obtain key pair".to_string())?;

            Ok(Box::new(BasicIdentity::from_key_pair(key_pair)))
        }
        _ => Err(format!("Invalid tag '{}' in pem file", pem.tag())),
    }
}

pub async fn build_ic_agent<I: 'static + Identity>(url: String, identity: I) -> Agent {
    let mainnet = is_mainnet(&url);
    let transport = ReqwestHttpReplicaV2Transport::create(url).expect("Failed to create Reqwest transport");

    let timeout = std::time::Duration::from_secs(60 * 5);

    let agent = Agent::builder()
        .with_transport(transport)
        .with_identity(identity)
        .with_ingress_expiry(Some(timeout))
        .build()
        .expect("Failed to build IC agent");

    if !mainnet {
        agent.fetch_root_key().await.expect("Couldn't fetch root key");
    }

    agent
}

pub fn is_mainnet(url: &str) -> bool {
    url.contains("ic0.app")
}
