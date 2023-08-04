#[macro_export]
macro_rules! canister_state {
    ($type:ty) => {
        use std::cell::RefCell;

        thread_local! {
            static __STATE: RefCell<Option<$type>> = RefCell::default();
        }

        const __STATE_ALREADY_INITIALIZED: &str = "State has already been initialized";
        const __STATE_NOT_INITIALIZED: &str = "State has not been initialized";

        fn init_state(state: $type) {
            __STATE.with(|s| {
                if s.borrow().is_some() {
                    panic!("{}", __STATE_ALREADY_INITIALIZED);
                } else {
                    *s.borrow_mut() = Some(state);
                }
            });
        }

        fn take_state() -> $type {
            __STATE.with(|s| s.take()).expect(__STATE_NOT_INITIALIZED)
        }

        fn read_state<F, R>(f: F) -> R
        where
            F: FnOnce(&$type) -> R,
        {
            __STATE.with(|s| f(s.borrow().as_ref().expect(__STATE_NOT_INITIALIZED)))
        }

        fn mutate_state<F, R>(f: F) -> R
        where
            F: FnOnce(&mut $type) -> R,
        {
            __STATE.with(|s| f(s.borrow_mut().as_mut().expect(__STATE_NOT_INITIALIZED)))
        }
    };
}

#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => {{
        let message = format!($($arg)*);
        let message = format!("INFO {message}");
        canistergeek_ic_rust::logger::log_message(message.clone());
        canistergeek_ic_rust::monitor::collect_metrics();
        ic_cdk::print(message);
    }}
}

#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => {{
        let message = format!($($arg)*);
        let message = format!("ERROR {message}");
        canistergeek_ic_rust::logger::log_message(message.clone());
        canistergeek_ic_rust::monitor::collect_metrics();
        ic_cdk::print(message);
    }}
}
