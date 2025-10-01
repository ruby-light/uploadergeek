export const idlFactory = ({ IDL }) => {
  const ProposalType = IDL.Variant({
    'UpdateGovernance' : IDL.Null,
    'UpgradeCanister' : IDL.Null,
    'CallCanister' : IDL.Null,
  });
  const ProposalPermission = IDL.Variant({
    'Add' : IDL.Null,
    'Vote' : IDL.Null,
    'Perform' : IDL.Null,
  });
  const GovernanceParticipant = IDL.Record({
    'proposal_permissions' : IDL.Vec(
      IDL.Tuple(ProposalType, IDL.Vec(ProposalPermission))
    ),
    'name' : IDL.Text,
  });
  const VotingConfig = IDL.Record({
    'stop_vote_count' : IDL.Nat32,
    'positive_vote_count' : IDL.Nat32,
  });
  const Governance = IDL.Record({
    'participants' : IDL.Vec(IDL.Tuple(IDL.Principal, GovernanceParticipant)),
    'voting_configuration' : IDL.Vec(IDL.Tuple(ProposalType, VotingConfig)),
  });
  const Args = IDL.Record({
    'governance' : Governance,
    'geek_user_principals' : IDL.Vec(IDL.Principal),
  });
  const UpgradeCanister = IDL.Record({
    'uploader_id' : IDL.Principal,
    'operator_id' : IDL.Principal,
    'canister_id' : IDL.Principal,
    'module_hash' : IDL.Text,
    'argument_candid' : IDL.Text,
  });
  const CallCanister = IDL.Record({
    'method' : IDL.Text,
    'canister_did' : IDL.Opt(IDL.Text),
    'canister_id' : IDL.Principal,
    'argument_candid' : IDL.Text,
    'payment' : IDL.Opt(IDL.Nat64),
  });
  const ProposalDetail = IDL.Variant({
    'UpdateGovernance' : IDL.Record({ 'new_governance' : Governance }),
    'UpgradeCanister' : IDL.Record({ 'task' : UpgradeCanister }),
    'CallCanister' : IDL.Record({ 'task' : CallCanister }),
  });
  const AddNewProposalArgs = IDL.Record({
    'proposal_detail' : ProposalDetail,
    'description' : IDL.Opt(IDL.Text),
  });
  const Vote = IDL.Record({
    'vote_time' : IDL.Nat64,
    'vote' : IDL.Bool,
    'participant' : IDL.Principal,
  });
  const Voting = IDL.Record({ 'votes' : IDL.Vec(Vote) });
  const PerformResult = IDL.Variant({
    'Error' : IDL.Record({ 'reason' : IDL.Text }),
    'Done' : IDL.Null,
    'CallResponse' : IDL.Record({
      'error' : IDL.Opt(IDL.Text),
      'response' : IDL.Vec(IDL.Nat8),
      'candid' : IDL.Opt(IDL.Text),
    }),
  });
  const ProposalState = IDL.Variant({
    'Approved' : IDL.Null,
    'Voting' : IDL.Null,
    'Declined' : IDL.Null,
    'Performed' : IDL.Record({ 'result' : PerformResult }),
  });
  const Proposal = IDL.Record({
    'created' : IDL.Nat64,
    'initiator' : IDL.Principal,
    'description' : IDL.Opt(IDL.Text),
    'voting' : Voting,
    'detail' : ProposalDetail,
    'state' : ProposalState,
    'updated' : IDL.Nat64,
    'proposal_id' : IDL.Nat64,
  });
  const AddNewProposalResult = IDL.Record({
    'proposal_id' : IDL.Nat64,
    'proposal' : Proposal,
  });
  const AddNewProposalError = IDL.Variant({
    'NotPermission' : IDL.Null,
    'Validation' : IDL.Record({ 'reason' : IDL.Text }),
  });
  const AddNewProposalResponse = IDL.Variant({
    'Ok' : AddNewProposalResult,
    'Err' : AddNewProposalError,
  });
  const StatusRequest = IDL.Record({
    'memory_size' : IDL.Bool,
    'cycles' : IDL.Bool,
    'heap_memory_size' : IDL.Bool,
  });
  const MetricsGranularity = IDL.Variant({
    'hourly' : IDL.Null,
    'daily' : IDL.Null,
  });
  const GetMetricsParameters = IDL.Record({
    'dateToMillis' : IDL.Nat,
    'granularity' : MetricsGranularity,
    'dateFromMillis' : IDL.Nat,
  });
  const MetricsRequest = IDL.Record({ 'parameters' : GetMetricsParameters });
  const GetLogMessagesFilter = IDL.Record({
    'analyzeCount' : IDL.Nat32,
    'messageRegex' : IDL.Opt(IDL.Text),
    'messageContains' : IDL.Opt(IDL.Text),
  });
  const GetLogMessagesParameters = IDL.Record({
    'count' : IDL.Nat32,
    'filter' : IDL.Opt(GetLogMessagesFilter),
    'fromTimeNanos' : IDL.Opt(IDL.Nat64),
  });
  const GetLatestLogMessagesParameters = IDL.Record({
    'upToTimeNanos' : IDL.Opt(IDL.Nat64),
    'count' : IDL.Nat32,
    'filter' : IDL.Opt(GetLogMessagesFilter),
  });
  const CanisterLogRequest = IDL.Variant({
    'getMessagesInfo' : IDL.Null,
    'getMessages' : GetLogMessagesParameters,
    'getLatestMessages' : GetLatestLogMessagesParameters,
  });
  const GetInformationRequest = IDL.Record({
    'status' : IDL.Opt(StatusRequest),
    'metrics' : IDL.Opt(MetricsRequest),
    'logs' : IDL.Opt(CanisterLogRequest),
    'version' : IDL.Bool,
  });
  const StatusResponse = IDL.Record({
    'memory_size' : IDL.Opt(IDL.Nat64),
    'cycles' : IDL.Opt(IDL.Nat64),
    'heap_memory_size' : IDL.Opt(IDL.Nat64),
  });
  const HourlyMetricsData = IDL.Record({
    'updateCalls' : IDL.Vec(IDL.Nat64),
    'canisterHeapMemorySize' : IDL.Vec(IDL.Nat64),
    'canisterCycles' : IDL.Vec(IDL.Nat64),
    'canisterMemorySize' : IDL.Vec(IDL.Nat64),
    'timeMillis' : IDL.Int,
  });
  const NumericEntity = IDL.Record({
    'avg' : IDL.Nat64,
    'max' : IDL.Nat64,
    'min' : IDL.Nat64,
    'first' : IDL.Nat64,
    'last' : IDL.Nat64,
  });
  const DailyMetricsData = IDL.Record({
    'updateCalls' : IDL.Nat64,
    'canisterHeapMemorySize' : NumericEntity,
    'canisterCycles' : NumericEntity,
    'canisterMemorySize' : NumericEntity,
    'timeMillis' : IDL.Int,
  });
  const CanisterMetricsData = IDL.Variant({
    'hourly' : IDL.Vec(HourlyMetricsData),
    'daily' : IDL.Vec(DailyMetricsData),
  });
  const CanisterMetrics = IDL.Record({ 'data' : CanisterMetricsData });
  const MetricsResponse = IDL.Record({ 'metrics' : IDL.Opt(CanisterMetrics) });
  const CanisterLogFeature = IDL.Variant({
    'filterMessageByContains' : IDL.Null,
    'filterMessageByRegex' : IDL.Null,
  });
  const CanisterLogMessagesInfo = IDL.Record({
    'features' : IDL.Vec(IDL.Opt(CanisterLogFeature)),
    'lastTimeNanos' : IDL.Opt(IDL.Nat64),
    'count' : IDL.Nat32,
    'firstTimeNanos' : IDL.Opt(IDL.Nat64),
  });
  const LogMessageData = IDL.Record({
    'timeNanos' : IDL.Nat64,
    'message' : IDL.Text,
  });
  const CanisterLogMessages = IDL.Record({
    'data' : IDL.Vec(LogMessageData),
    'lastAnalyzedMessageTimeNanos' : IDL.Opt(IDL.Nat64),
  });
  const CanisterLogResponse = IDL.Variant({
    'messagesInfo' : CanisterLogMessagesInfo,
    'messages' : CanisterLogMessages,
  });
  const GetInformationResponse = IDL.Record({
    'status' : IDL.Opt(StatusResponse),
    'metrics' : IDL.Opt(MetricsResponse),
    'logs' : IDL.Opt(CanisterLogResponse),
    'version' : IDL.Opt(IDL.Nat),
  });
  const GetGeekUserPrincipalsResult = IDL.Record({
    'geek_user_principals' : IDL.Vec(IDL.Principal),
  });
  const GetGeekUserPrincipalsResponse = IDL.Variant({
    'Ok' : GetGeekUserPrincipalsResult,
  });
  const GetGovernanceResult = IDL.Record({ 'governance' : Governance });
  const GetGovernanceResponse = IDL.Variant({ 'Ok' : GetGovernanceResult });
  const GetMyGovernanceParticipantResult = IDL.Record({
    'participant' : GovernanceParticipant,
  });
  const GetMyGovernanceParticipantError = IDL.Variant({
    'NotRegistered' : IDL.Record({ 'your_principal' : IDL.Principal }),
  });
  const GetMyGovernanceParticipantResponse = IDL.Variant({
    'Ok' : GetMyGovernanceParticipantResult,
    'Err' : GetMyGovernanceParticipantError,
  });
  const GetProposalArgs = IDL.Record({ 'proposal_id' : IDL.Nat64 });
  const GetProposalResult = IDL.Record({ 'proposal' : Proposal });
  const GetProposalError = IDL.Variant({ 'ProposalNotFound' : IDL.Null });
  const GetProposalResponse = IDL.Variant({
    'Ok' : GetProposalResult,
    'Err' : GetProposalError,
  });
  const GetProposalsArgs = IDL.Record({
    'count' : IDL.Nat64,
    'start' : IDL.Nat64,
    'ascending' : IDL.Bool,
  });
  const ProposalInfo = IDL.Record({
    'proposal_id' : IDL.Nat64,
    'proposal' : Proposal,
  });
  const GetProposalsResult = IDL.Record({
    'proposals' : IDL.Vec(ProposalInfo),
    'total_count' : IDL.Nat64,
  });
  const GetProposalsResponse = IDL.Variant({ 'Ok' : GetProposalsResult });
  const PerformProposalError = IDL.Variant({
    'NotPermission' : IDL.Null,
    'ProposalIsNotApprovedState' : IDL.Null,
    'ProposalNotFound' : IDL.Null,
  });
  const PerformProposalResponse = IDL.Variant({
    'Ok' : GetProposalResult,
    'Err' : PerformProposalError,
  });
  const SetGeekUserPrincipalsArgs = IDL.Record({
    'geek_user_principals' : IDL.Vec(IDL.Principal),
  });
  const SetGeekUserPrincipalsError = IDL.Variant({
    'LoseControlDangerous' : IDL.Null,
  });
  const SetGeekUserPrincipalsResponse = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : SetGeekUserPrincipalsError,
  });
  const CollectMetricsRequestType = IDL.Variant({
    'force' : IDL.Null,
    'normal' : IDL.Null,
  });
  const UpdateInformationRequest = IDL.Record({
    'metrics' : IDL.Opt(CollectMetricsRequestType),
  });
  const VoteForProposalArgs = IDL.Record({
    'vote' : IDL.Bool,
    'proposal_id' : IDL.Nat64,
  });
  const VoteForProposalError = IDL.Variant({
    'AlreadyVoted' : IDL.Null,
    'ProposalIsNotVotingState' : IDL.Null,
    'VotingConfigNotFound' : IDL.Null,
    'NotPermission' : IDL.Null,
    'ProposalNotFound' : IDL.Null,
  });
  const VoteForProposalResponse = IDL.Variant({
    'Ok' : GetProposalResult,
    'Err' : VoteForProposalError,
  });
  return IDL.Service({
    'add_new_proposal' : IDL.Func(
        [AddNewProposalArgs],
        [AddNewProposalResponse],
        [],
      ),
    'getCanistergeekInformation' : IDL.Func(
        [GetInformationRequest],
        [IDL.Opt(GetInformationResponse)],
        ['query'],
      ),
    'get_geek_user_principals' : IDL.Func(
        [IDL.Record({})],
        [GetGeekUserPrincipalsResponse],
        ['query'],
      ),
    'get_governance' : IDL.Func(
        [IDL.Record({})],
        [GetGovernanceResponse],
        ['query'],
      ),
    'get_my_governance_participant' : IDL.Func(
        [IDL.Record({})],
        [GetMyGovernanceParticipantResponse],
        ['query'],
      ),
    'get_proposal' : IDL.Func(
        [GetProposalArgs],
        [GetProposalResponse],
        ['query'],
      ),
    'get_proposals' : IDL.Func(
        [GetProposalsArgs],
        [GetProposalsResponse],
        ['query'],
      ),
    'perform_proposal' : IDL.Func(
        [GetProposalArgs],
        [PerformProposalResponse],
        [],
      ),
    'set_geek_user_principals' : IDL.Func(
        [SetGeekUserPrincipalsArgs],
        [SetGeekUserPrincipalsResponse],
        [],
      ),
    'updateCanistergeekInformation' : IDL.Func(
        [UpdateInformationRequest],
        [],
        [],
      ),
    'vote_for_proposal' : IDL.Func(
        [VoteForProposalArgs],
        [VoteForProposalResponse],
        [],
      ),
  });
};
export const init = ({ IDL }) => {
  const ProposalType = IDL.Variant({
    'UpdateGovernance' : IDL.Null,
    'UpgradeCanister' : IDL.Null,
    'CallCanister' : IDL.Null,
  });
  const ProposalPermission = IDL.Variant({
    'Add' : IDL.Null,
    'Vote' : IDL.Null,
    'Perform' : IDL.Null,
  });
  const GovernanceParticipant = IDL.Record({
    'proposal_permissions' : IDL.Vec(
      IDL.Tuple(ProposalType, IDL.Vec(ProposalPermission))
    ),
    'name' : IDL.Text,
  });
  const VotingConfig = IDL.Record({
    'stop_vote_count' : IDL.Nat32,
    'positive_vote_count' : IDL.Nat32,
  });
  const Governance = IDL.Record({
    'participants' : IDL.Vec(IDL.Tuple(IDL.Principal, GovernanceParticipant)),
    'voting_configuration' : IDL.Vec(IDL.Tuple(ProposalType, VotingConfig)),
  });
  const Args = IDL.Record({
    'governance' : Governance,
    'geek_user_principals' : IDL.Vec(IDL.Principal),
  });
  return [Args];
};
