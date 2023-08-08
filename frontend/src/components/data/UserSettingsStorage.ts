import {ThemeId, validateThemeId} from "src/components/sys/theme/Theme";
import {KeyValueStoreFacade} from "geekfactory-js-util/lib/es5/store/KeyValueStoreFacade";

type Dictionary = {
    theme: ThemeId
}

const store = KeyValueStoreFacade.createStore("governancegeek--theme--");

export class UserSettingsStorage {

    private readonly dictionary: Dictionary

    constructor() {
        this.dictionary = store.get("dictionary") || {};
    }

    get theme(): ThemeId {
        return this.dictionary.theme || "light";
    }

    set theme(value: ThemeId) {
        this.dictionary.theme = validateThemeId(value);
        this.saveDictionary()
    }

    private saveDictionary = () => store.set("dictionary", this.dictionary)
}

const userSettingsStorage = new UserSettingsStorage();

export {userSettingsStorage}