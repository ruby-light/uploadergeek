use candid_parser::parse_idl_args;
use governance_canister::decode_candid_response::*;
use ic_cdk_macros::query;

use crate::updates::perform_proposal::decode_method_response;

#[query]
fn decode_candid_response(
    Args {
        canister_did,
        method,
        response,
    }: Args,
) -> Response {
    decode_candid_response_int(canister_did, method, response).into()
}

pub(crate) fn decode_candid_response_int(
    canister_did: String,
    method: String,
    response: String,
) -> Result<DecodeCandidResponseResult, DecodeCandidResponseError> {
    let raw = hex::decode(response.clone()).or_else(|_| {
        let args = parse_idl_args(response.as_str()).map_err(|error| DecodeCandidResponseError::DecodeError {
            error: format!("{}", error),
        })?;

        let value = args.args.first().unwrap();
        if let candid::IDLValue::Blob(raw) = &value {
            Ok(raw.clone())
        } else {
            Err(DecodeCandidResponseError::DecodeError {
                error: format!("invalid blob {:?}", value),
            })
        }
    })?;

    let args = decode_method_response(canister_did.as_str(), method.as_str(), &raw).map_err(|error| {
        DecodeCandidResponseError::ParseError {
            error: error.to_string(),
        }
    })?;

    Ok(DecodeCandidResponseResult {
        candid: args.to_string(),
    })
}

#[cfg(test)]
mod tests {

    use crate::queries::decode_candid_response::decode_candid_response_int;

    #[test]
    fn test_decode_from_hex() {
        let hex = "4449444c056b02bc8a0101c5fed201036c01ddd19144026d7b6b01aa8cf0890a046c01c49ff4e40f71010000384449444c036b01bc8a01016c01bec6aed90f026d6801000001011d65c17eb1e18ed3ac6311ccb054646294c9303870033c978dceef77f702";

        let canister_did = r#"
                type CallResponse = variant {
                  Ok : CallResult;
                  Err : CallError;
                };
                type CallError = variant { CallError : record { reason : text } };
                type CallResult = record { result : blob };
                service : {
                  perform_call : () -> (CallResponse);
                }
                "#;

        let result = decode_candid_response_int(canister_did.to_owned(), "perform_call".to_owned(), hex.to_owned());
        assert!(result.is_ok());
        // println!(">>> {}", result.unwrap().candid);
    }

    #[test]
    fn test_decode_from_blob() {
        let blob = r#"(
            blob "\44\49\44\4c\03\6b\01\bc\8a\01\01\6c\01\be\c6\ae\d9\0f\02\6d\68\01\00\00\01\01\1d\65\c1\7e\b1\e1\8e\d3\ac\63\11\cc\b0\54\64\62\94\c9\30\38\70\03\3c\97\8d\ce\ef\77\f7\02"
            )"#;

        let canister_did = r#"
            type AddNewProposalArgs = record {
              proposal_detail : ProposalDetail;
              description : opt text;
            };
            type AddNewProposalError = variant {
              NotPermission;
              Validation : record { reason : text };
            };
            type AddNewProposalResponse = variant {
              Ok : AddNewProposalResult;
              Err : AddNewProposalError;
            };
            type AddNewProposalResult = record { proposal_id : nat64; proposal : Proposal };
            type Args = record {
              governance : Governance;
              geek_user_principals : vec principal;
            };
            type CallCanister = record {
              method : text;
              canister_did : opt text;
              canister_id : principal;
              argument_candid : text;
              payment : opt nat64;
            };
            type CanisterLogFeature = variant {
              filterMessageByContains;
              filterMessageByRegex;
            };
            type CanisterLogMessages = record {
              data : vec LogMessageData;
              lastAnalyzedMessageTimeNanos : opt nat64;
            };
            type CanisterLogMessagesInfo = record {
              features : vec opt CanisterLogFeature;
              lastTimeNanos : opt nat64;
              count : nat32;
              firstTimeNanos : opt nat64;
            };
            type CanisterLogRequest = variant {
              getMessagesInfo;
              getMessages : GetLogMessagesParameters;
              getLatestMessages : GetLatestLogMessagesParameters;
            };
            type CanisterLogResponse = variant {
              messagesInfo : CanisterLogMessagesInfo;
              messages : CanisterLogMessages;
            };
            type CanisterMetrics = record { data : CanisterMetricsData };
            type CanisterMetricsData = variant {
              hourly : vec HourlyMetricsData;
              daily : vec DailyMetricsData;
            };
            type CollectMetricsRequestType = variant { force; normal };
            type DailyMetricsData = record {
              updateCalls : nat64;
              canisterHeapMemorySize : NumericEntity;
              canisterCycles : NumericEntity;
              canisterMemorySize : NumericEntity;
              timeMillis : int;
            };
            type GetGeekUserPrincipalsResponse = variant {
              Ok : GetGeekUserPrincipalsResult;
            };
            type GetGeekUserPrincipalsResult = record {
              geek_user_principals : vec principal;
            };
            type GetGovernanceResponse = variant { Ok : GetGovernanceResult };
            type GetGovernanceResult = record { governance : Governance };
            type GetInformationRequest = record {
              status : opt StatusRequest;
              metrics : opt MetricsRequest;
              logs : opt CanisterLogRequest;
              version : bool;
            };
            type GetInformationResponse = record {
              status : opt StatusResponse;
              metrics : opt MetricsResponse;
              logs : opt CanisterLogResponse;
              version : opt nat;
            };
            type GetLatestLogMessagesParameters = record {
              upToTimeNanos : opt nat64;
              count : nat32;
              filter : opt GetLogMessagesFilter;
            };
            type GetLogMessagesFilter = record {
              analyzeCount : nat32;
              messageRegex : opt text;
              messageContains : opt text;
            };
            type GetLogMessagesParameters = record {
              count : nat32;
              filter : opt GetLogMessagesFilter;
              fromTimeNanos : opt nat64;
            };
            type GetMetricsParameters = record {
              dateToMillis : nat;
              granularity : MetricsGranularity;
              dateFromMillis : nat;
            };
            type GetMyGovernanceParticipantError = variant {
              NotRegistered : record { your_principal : principal };
            };
            type GetMyGovernanceParticipantResponse = variant {
              Ok : GetMyGovernanceParticipantResult;
              Err : GetMyGovernanceParticipantError;
            };
            type GetMyGovernanceParticipantResult = record {
              participant : GovernanceParticipant;
            };
            type GetProposalArgs = record { proposal_id : nat64 };
            type GetProposalError = variant { ProposalNotFound };
            type GetProposalResponse = variant {
              Ok : GetProposalResult;
              Err : GetProposalError;
            };
            type GetProposalResult = record { proposal : Proposal };
            type GetProposalsArgs = record {
              count : nat64;
              start : nat64;
              ascending : bool;
            };
            type GetProposalsResponse = variant { Ok : GetProposalsResult };
            type GetProposalsResult = record {
              proposals : vec ProposalInfo;
              total_count : nat64;
            };
            type Governance = record {
              participants : vec record { principal; GovernanceParticipant };
              voting_configuration : vec record { ProposalType; VotingConfig };
            };
            type GovernanceParticipant = record {
              proposal_permissions : vec record { ProposalType; vec ProposalPermission };
              name : text;
            };
            type HourlyMetricsData = record {
              updateCalls : vec nat64;
              canisterHeapMemorySize : vec nat64;
              canisterCycles : vec nat64;
              canisterMemorySize : vec nat64;
              timeMillis : int;
            };
            type LogMessageData = record { timeNanos : nat64; message : text };
            type MetricsGranularity = variant { hourly; daily };
            type MetricsRequest = record { parameters : GetMetricsParameters };
            type MetricsResponse = record { metrics : opt CanisterMetrics };
            type NumericEntity = record {
              avg : nat64;
              max : nat64;
              min : nat64;
              first : nat64;
              last : nat64;
            };
            type PerformProposalError = variant {
              NotPermission;
              ProposalIsNotApprovedState;
              ProposalNotFound;
            };
            type PerformProposalResponse = variant {
              Ok : GetProposalResult;
              Err : PerformProposalError;
            };
            type PerformResult = variant {
              Error : record { reason : text };
              Done;
              CallResponse : record {
                error : opt text;
                response : blob;
                candid : opt text;
              };
            };
            type Proposal = record {
              created : nat64;
              initiator : principal;
              description : opt text;
              voting : Voting;
              detail : ProposalDetail;
              state : ProposalState;
              updated : nat64;
              proposal_id : nat64;
            };
            type ProposalDetail = variant {
              UpdateGovernance : record { new_governance : Governance };
              UpgradeCanister : record { task : UpgradeCanister };
              CallCanister : record { task : CallCanister };
            };
            type ProposalInfo = record { proposal_id : nat64; proposal : Proposal };
            type ProposalPermission = variant { Add; Vote; Perform };
            type ProposalState = variant {
              Approved;
              Voting;
              Declined;
              Performed : record { result : PerformResult };
            };
            type ProposalType = variant { UpdateGovernance; UpgradeCanister; CallCanister };
            type SetGeekUserPrincipalsArgs = record {
              geek_user_principals : vec principal;
            };
            type SetGeekUserPrincipalsError = variant { LoseControlDangerous };
            type SetGeekUserPrincipalsResponse = variant {
              Ok;
              Err : SetGeekUserPrincipalsError;
            };
            type StatusRequest = record {
              memory_size : bool;
              cycles : bool;
              heap_memory_size : bool;
            };
            type StatusResponse = record {
              memory_size : opt nat64;
              cycles : opt nat64;
              heap_memory_size : opt nat64;
            };
            type UpdateInformationRequest = record {
              metrics : opt CollectMetricsRequestType;
            };
            type UpgradeCanister = record {
              uploader_id : principal;
              operator_id : principal;
              canister_id : principal;
              module_hash : text;
              argument_candid : text;
            };
            type Vote = record { vote_time : nat64; vote : bool; participant : principal };
            type VoteForProposalArgs = record { vote : bool; proposal_id : nat64 };
            type VoteForProposalError = variant {
              AlreadyVoted;
              ProposalIsNotVotingState;
              VotingConfigNotFound;
              NotPermission;
              ProposalNotFound;
            };
            type VoteForProposalResponse = variant {
              Ok : GetProposalResult;
              Err : VoteForProposalError;
            };
            type Voting = record { votes : vec Vote };
            type VotingConfig = record {
              stop_vote_count : nat32;
              positive_vote_count : nat32;
            };
            service : (Args) -> {
              add_new_proposal : (AddNewProposalArgs) -> (AddNewProposalResponse);
              getCanistergeekInformation : (GetInformationRequest) -> (
                  opt GetInformationResponse,
                ) query;
              get_geek_user_principals : (record {}) -> (
                  GetGeekUserPrincipalsResponse,
                ) query;
              get_governance : (record {}) -> (GetGovernanceResponse) query;
              get_my_governance_participant : (record {}) -> (
                  GetMyGovernanceParticipantResponse,
                ) query;
              get_proposal : (GetProposalArgs) -> (GetProposalResponse) query;
              get_proposals : (GetProposalsArgs) -> (GetProposalsResponse) query;
              perform_proposal : (GetProposalArgs) -> (PerformProposalResponse);
              set_geek_user_principals : (SetGeekUserPrincipalsArgs) -> (
                  SetGeekUserPrincipalsResponse,
                );
              updateCanistergeekInformation : (UpdateInformationRequest) -> ();
              vote_for_proposal : (VoteForProposalArgs) -> (VoteForProposalResponse);
            }           "#;

        let result = decode_candid_response_int(
            canister_did.to_owned(),
            "get_geek_user_principals".to_owned(),
            blob.to_owned(),
        );
        assert!(result.is_ok());
        // println!(">>>> result: {result:?}");
    }
}
