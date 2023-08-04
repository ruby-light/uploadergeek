use governance_canister::types::TimestampMillis;

pub type TimestampNanos = u128;

const NANOS_PER_MILLISECOND: u128 = 1_000_000;

pub(crate) fn get_unix_epoch_time_nanos() -> TimestampNanos {
    ic_cdk::api::time().into()
}

pub(crate) fn get_unix_epoch_time_millis() -> TimestampMillis {
    nanos_to_millis(&get_unix_epoch_time_nanos())
}

fn nanos_to_millis(nanos: &TimestampNanos) -> TimestampMillis {
    (nanos / NANOS_PER_MILLISECOND) as u64
}
