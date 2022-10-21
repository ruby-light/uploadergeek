# Uploadergeek

Это канистра и клиентская библиотека, которая позволяют инсталировать и упгрейдить канистры wasm модулем размер которого
превышает 2M.

## Deploy uploader canister

Deploy canister `uploader`:
```sh
dfx deploy
```

Set security access for your principals:
```sh
dfx canister call uploader set_service_principals '(record{service_principals=vec{principal "..."}})'
```

## Set uploader access

Add uploader canister to target canister controllers:
```sh
dfx canister update-settings --add-controller <UPLOADER_CANISTER_ID> <TARGET_CANISTER>
```

## Uploader client
