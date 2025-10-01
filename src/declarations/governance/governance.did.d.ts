import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AddNewProposalArgs {
  'proposal_detail' : ProposalDetail,
  'description' : [] | [string],
}
export type AddNewProposalError = { 'NotPermission' : null } |
  { 'Validation' : { 'reason' : string } };
export type AddNewProposalResponse = { 'Ok' : AddNewProposalResult } |
  { 'Err' : AddNewProposalError };
export interface AddNewProposalResult {
  'proposal_id' : bigint,
  'proposal' : Proposal,
}
export interface Args {
  'governance' : Governance,
  'geek_user_principals' : Array<Principal>,
}
export interface CallCanister {
  'method' : string,
  'canister_did' : [] | [string],
  'canister_id' : Principal,
  'argument_candid' : string,
  'payment' : [] | [bigint],
}
export type CanisterLogFeature = { 'filterMessageByContains' : null } |
  { 'filterMessageByRegex' : null };
export interface CanisterLogMessages {
  'data' : Array<LogMessageData>,
  'lastAnalyzedMessageTimeNanos' : [] | [bigint],
}
export interface CanisterLogMessagesInfo {
  'features' : Array<[] | [CanisterLogFeature]>,
  'lastTimeNanos' : [] | [bigint],
  'count' : number,
  'firstTimeNanos' : [] | [bigint],
}
export type CanisterLogRequest = { 'getMessagesInfo' : null } |
  { 'getMessages' : GetLogMessagesParameters } |
  { 'getLatestMessages' : GetLatestLogMessagesParameters };
export type CanisterLogResponse = { 'messagesInfo' : CanisterLogMessagesInfo } |
  { 'messages' : CanisterLogMessages };
export interface CanisterMetrics { 'data' : CanisterMetricsData }
export type CanisterMetricsData = { 'hourly' : Array<HourlyMetricsData> } |
  { 'daily' : Array<DailyMetricsData> };
export type CollectMetricsRequestType = { 'force' : null } |
  { 'normal' : null };
export interface DailyMetricsData {
  'updateCalls' : bigint,
  'canisterHeapMemorySize' : NumericEntity,
  'canisterCycles' : NumericEntity,
  'canisterMemorySize' : NumericEntity,
  'timeMillis' : bigint,
}
export type GetGeekUserPrincipalsResponse = {
    'Ok' : GetGeekUserPrincipalsResult
  };
export interface GetGeekUserPrincipalsResult {
  'geek_user_principals' : Array<Principal>,
}
export type GetGovernanceResponse = { 'Ok' : GetGovernanceResult };
export interface GetGovernanceResult { 'governance' : Governance }
export interface GetInformationRequest {
  'status' : [] | [StatusRequest],
  'metrics' : [] | [MetricsRequest],
  'logs' : [] | [CanisterLogRequest],
  'version' : boolean,
}
export interface GetInformationResponse {
  'status' : [] | [StatusResponse],
  'metrics' : [] | [MetricsResponse],
  'logs' : [] | [CanisterLogResponse],
  'version' : [] | [bigint],
}
export interface GetLatestLogMessagesParameters {
  'upToTimeNanos' : [] | [bigint],
  'count' : number,
  'filter' : [] | [GetLogMessagesFilter],
}
export interface GetLogMessagesFilter {
  'analyzeCount' : number,
  'messageRegex' : [] | [string],
  'messageContains' : [] | [string],
}
export interface GetLogMessagesParameters {
  'count' : number,
  'filter' : [] | [GetLogMessagesFilter],
  'fromTimeNanos' : [] | [bigint],
}
export interface GetMetricsParameters {
  'dateToMillis' : bigint,
  'granularity' : MetricsGranularity,
  'dateFromMillis' : bigint,
}
export type GetMyGovernanceParticipantError = {
    'NotRegistered' : { 'your_principal' : Principal }
  };
export type GetMyGovernanceParticipantResponse = {
    'Ok' : GetMyGovernanceParticipantResult
  } |
  { 'Err' : GetMyGovernanceParticipantError };
export interface GetMyGovernanceParticipantResult {
  'participant' : GovernanceParticipant,
}
export interface GetProposalArgs { 'proposal_id' : bigint }
export type GetProposalError = { 'ProposalNotFound' : null };
export type GetProposalResponse = { 'Ok' : GetProposalResult } |
  { 'Err' : GetProposalError };
export interface GetProposalResult { 'proposal' : Proposal }
export interface GetProposalsArgs {
  'count' : bigint,
  'start' : bigint,
  'ascending' : boolean,
}
export type GetProposalsResponse = { 'Ok' : GetProposalsResult };
export interface GetProposalsResult {
  'proposals' : Array<ProposalInfo>,
  'total_count' : bigint,
}
export interface Governance {
  'participants' : Array<[Principal, GovernanceParticipant]>,
  'voting_configuration' : Array<[ProposalType, VotingConfig]>,
}
export interface GovernanceParticipant {
  'proposal_permissions' : Array<[ProposalType, Array<ProposalPermission>]>,
  'name' : string,
}
export interface HourlyMetricsData {
  'updateCalls' : BigUint64Array | bigint[],
  'canisterHeapMemorySize' : BigUint64Array | bigint[],
  'canisterCycles' : BigUint64Array | bigint[],
  'canisterMemorySize' : BigUint64Array | bigint[],
  'timeMillis' : bigint,
}
export interface LogMessageData { 'timeNanos' : bigint, 'message' : string }
export type MetricsGranularity = { 'hourly' : null } |
  { 'daily' : null };
export interface MetricsRequest { 'parameters' : GetMetricsParameters }
export interface MetricsResponse { 'metrics' : [] | [CanisterMetrics] }
export interface NumericEntity {
  'avg' : bigint,
  'max' : bigint,
  'min' : bigint,
  'first' : bigint,
  'last' : bigint,
}
export type PerformProposalError = { 'NotPermission' : null } |
  { 'ProposalIsNotApprovedState' : null } |
  { 'ProposalNotFound' : null };
export type PerformProposalResponse = { 'Ok' : GetProposalResult } |
  { 'Err' : PerformProposalError };
export type PerformResult = { 'Error' : { 'reason' : string } } |
  { 'Done' : null } |
  {
    'CallResponse' : {
      'error' : [] | [string],
      'response' : Uint8Array | number[],
      'candid' : [] | [string],
    }
  };
export interface Proposal {
  'created' : bigint,
  'initiator' : Principal,
  'description' : [] | [string],
  'voting' : Voting,
  'detail' : ProposalDetail,
  'state' : ProposalState,
  'updated' : bigint,
  'proposal_id' : bigint,
}
export type ProposalDetail = {
    'UpdateGovernance' : { 'new_governance' : Governance }
  } |
  { 'UpgradeCanister' : { 'task' : UpgradeCanister } } |
  { 'CallCanister' : { 'task' : CallCanister } };
export interface ProposalInfo { 'proposal_id' : bigint, 'proposal' : Proposal }
export type ProposalPermission = { 'Add' : null } |
  { 'Vote' : null } |
  { 'Perform' : null };
export type ProposalState = { 'Approved' : null } |
  { 'Voting' : null } |
  { 'Declined' : null } |
  { 'Performed' : { 'result' : PerformResult } };
export type ProposalType = { 'UpdateGovernance' : null } |
  { 'UpgradeCanister' : null } |
  { 'CallCanister' : null };
export interface SetGeekUserPrincipalsArgs {
  'geek_user_principals' : Array<Principal>,
}
export type SetGeekUserPrincipalsError = { 'LoseControlDangerous' : null };
export type SetGeekUserPrincipalsResponse = { 'Ok' : null } |
  { 'Err' : SetGeekUserPrincipalsError };
export interface StatusRequest {
  'memory_size' : boolean,
  'cycles' : boolean,
  'heap_memory_size' : boolean,
}
export interface StatusResponse {
  'memory_size' : [] | [bigint],
  'cycles' : [] | [bigint],
  'heap_memory_size' : [] | [bigint],
}
export interface UpdateInformationRequest {
  'metrics' : [] | [CollectMetricsRequestType],
}
export interface UpgradeCanister {
  'uploader_id' : Principal,
  'operator_id' : Principal,
  'canister_id' : Principal,
  'module_hash' : string,
  'argument_candid' : string,
}
export interface Vote {
  'vote_time' : bigint,
  'vote' : boolean,
  'participant' : Principal,
}
export interface VoteForProposalArgs {
  'vote' : boolean,
  'proposal_id' : bigint,
}
export type VoteForProposalError = { 'AlreadyVoted' : null } |
  { 'ProposalIsNotVotingState' : null } |
  { 'VotingConfigNotFound' : null } |
  { 'NotPermission' : null } |
  { 'ProposalNotFound' : null };
export type VoteForProposalResponse = { 'Ok' : GetProposalResult } |
  { 'Err' : VoteForProposalError };
export interface Voting { 'votes' : Array<Vote> }
export interface VotingConfig {
  'stop_vote_count' : number,
  'positive_vote_count' : number,
}
export interface _SERVICE {
  'add_new_proposal' : ActorMethod<
    [AddNewProposalArgs],
    AddNewProposalResponse
  >,
  'getCanistergeekInformation' : ActorMethod<
    [GetInformationRequest],
    [] | [GetInformationResponse]
  >,
  'get_geek_user_principals' : ActorMethod<[{}], GetGeekUserPrincipalsResponse>,
  'get_governance' : ActorMethod<[{}], GetGovernanceResponse>,
  'get_my_governance_participant' : ActorMethod<
    [{}],
    GetMyGovernanceParticipantResponse
  >,
  'get_proposal' : ActorMethod<[GetProposalArgs], GetProposalResponse>,
  'get_proposals' : ActorMethod<[GetProposalsArgs], GetProposalsResponse>,
  'perform_proposal' : ActorMethod<[GetProposalArgs], PerformProposalResponse>,
  'set_geek_user_principals' : ActorMethod<
    [SetGeekUserPrincipalsArgs],
    SetGeekUserPrincipalsResponse
  >,
  'updateCanistergeekInformation' : ActorMethod<
    [UpdateInformationRequest],
    undefined
  >,
  'vote_for_proposal' : ActorMethod<
    [VoteForProposalArgs],
    VoteForProposalResponse
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
