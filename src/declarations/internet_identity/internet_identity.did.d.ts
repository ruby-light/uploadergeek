import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AddTentativeDeviceResponse = {
    /**
     * Device registration mode is off, either due to timeout or because it was never enabled.
     */
    'device_registration_mode_off' : null
  } |
  {
    /**
     * There is another device already added tentatively
     */
    'another_device_tentatively_added' : null
  } |
  {
    /**
     * The device was tentatively added.
     */
    'added_tentatively' : {
      'verification_code' : string,
      'device_registration_timeout' : Timestamp,
    }
  };
export interface Challenge {
  'png_base64' : string,
  'challenge_key' : ChallengeKey,
}
export type ChallengeKey = string;
export interface ChallengeResult { 'key' : ChallengeKey, 'chars' : string }
export type CredentialId = Uint8Array | number[];
export interface Delegation {
  'pubkey' : PublicKey,
  'targets' : [] | [Array<Principal>],
  'expiration' : Timestamp,
}
export interface DeviceData {
  'alias' : string,
  'protection' : DeviceProtection,
  'pubkey' : DeviceKey,
  'key_type' : KeyType,
  'purpose' : Purpose,
  'credential_id' : [] | [CredentialId],
}
export type DeviceKey = PublicKey;
/**
 * This describes whether a device is "protected" or not.
 * When protected, a device can only be updated or removed if the
 * user is authenticated with that very device.
 */
export type DeviceProtection = { 'unprotected' : null } |
  { 'protected' : null };
export interface DeviceRegistrationInfo {
  'tentative_device' : [] | [DeviceData],
  'expiration' : Timestamp,
}
export type FrontendHostname = string;
export type GetDelegationResponse = {
    /**
     * The signature is not ready. Maybe retry by calling `prepare_delegation`
     */
    'no_such_delegation' : null
  } |
  {
    /**
     * The signed delegation was successfully retrieved.
     */
    'signed_delegation' : SignedDelegation
  };
export type HeaderField = [string, string];
export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
  'streaming_strategy' : [] | [StreamingStrategy],
  'status_code' : number,
}
export interface IdentityAnchorInfo {
  'devices' : Array<DeviceData>,
  'device_registration' : [] | [DeviceRegistrationInfo],
}
export interface InternetIdentityInit {
  'assigned_user_number_range' : [bigint, bigint],
}
export interface InternetIdentityStats {
  'users_registered' : bigint,
  'assigned_user_number_range' : [bigint, bigint],
}
export type KeyType = { 'platform' : null } |
  { 'seed_phrase' : null } |
  { 'cross_platform' : null } |
  { 'unknown' : null };
export type PublicKey = Uint8Array | number[];
export type Purpose = { 'authentication' : null } |
  { 'recovery' : null };
export type RegisterResponse = {
    /**
     * The challenge was not successful.
     */
    'bad_challenge' : null
  } |
  {
    /**
     * No more registrations are possible in this instance of the II service canister.
     */
    'canister_full' : null
  } |
  {
    /**
     * A new user was successfully registered.
     */
    'registered' : { 'user_number' : UserNumber }
  };
export type SessionKey = PublicKey;
export interface SignedDelegation {
  'signature' : Uint8Array | number[],
  'delegation' : Delegation,
}
export interface StreamingCallbackHttpResponse {
  'token' : [] | [Token],
  'body' : Uint8Array | number[],
}
export type StreamingStrategy = {
    'Callback' : { 'token' : Token, 'callback' : [Principal, string] }
  };
export type Timestamp = bigint;
export type Token = {};
export type UserKey = PublicKey;
export type UserNumber = bigint;
export type VerifyTentativeDeviceResponse = {
    /**
     * Device registration mode is off, either due to timeout or because it was never enabled.
     */
    'device_registration_mode_off' : null
  } |
  {
    /**
     * The device was successfully verified.
     */
    'verified' : null
  } |
  {
    /**
     * Wrong verification code entered. Retry with correct code.
     */
    'wrong_code' : { 'retries_left' : number }
  } |
  {
    /**
     * There is no tentative device to be verified.
     */
    'no_device_to_verify' : null
  };
export interface _SERVICE {
  'add' : ActorMethod<[UserNumber, DeviceData], undefined>,
  'add_tentative_device' : ActorMethod<
    [UserNumber, DeviceData],
    AddTentativeDeviceResponse
  >,
  'create_challenge' : ActorMethod<[], Challenge>,
  'enter_device_registration_mode' : ActorMethod<[UserNumber], Timestamp>,
  'exit_device_registration_mode' : ActorMethod<[UserNumber], undefined>,
  'get_anchor_info' : ActorMethod<[UserNumber], IdentityAnchorInfo>,
  'get_delegation' : ActorMethod<
    [UserNumber, FrontendHostname, SessionKey, Timestamp],
    GetDelegationResponse
  >,
  'get_principal' : ActorMethod<[UserNumber, FrontendHostname], Principal>,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'init_salt' : ActorMethod<[], undefined>,
  /**
   * Returns all devices of the user (authentication and recovery) but no information about device registrations.
   * Note: Will be changed in the future to be more consistent with get_anchor_info.
   */
  'lookup' : ActorMethod<[UserNumber], Array<DeviceData>>,
  'prepare_delegation' : ActorMethod<
    [UserNumber, FrontendHostname, SessionKey, [] | [bigint]],
    [UserKey, Timestamp]
  >,
  'register' : ActorMethod<[DeviceData, ChallengeResult], RegisterResponse>,
  'remove' : ActorMethod<[UserNumber, DeviceKey], undefined>,
  'stats' : ActorMethod<[], InternetIdentityStats>,
  'update' : ActorMethod<[UserNumber, DeviceKey, DeviceData], undefined>,
  'verify_tentative_device' : ActorMethod<
    [UserNumber, string],
    VerifyTentativeDeviceResponse
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
