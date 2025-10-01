import {InMemoryKeyValueStore, LocalStorageKeyValueStore} from './KeyValueStore';

describe('InMemoryKeyValueStore', () => {
    let store: InMemoryKeyValueStore;

    beforeEach(() => {
        store = new InMemoryKeyValueStore();
    });

    describe('isFake', () => {
        it('should return true', () => {
            expect(store.isFake()).toBe(true);
        });
    });

    describe('set and get', () => {
        it('should store and retrieve string values', () => {
            store.set('key1', 'value1');
            expect(store.get('key1')).toBe('value1');
        });

        it('should return undefined for non-existent keys', () => {
            expect(store.get('nonexistent')).toBeUndefined();
        });

        it('should overwrite existing values', () => {
            store.set('key2', 'initial');
            store.set('key2', 'updated');
            expect(store.get('key2')).toBe('updated');
        });
    });

    describe('remove', () => {
        it('should remove existing key', () => {
            store.set('key3', 'value3');
            store.remove('key3');
            expect(store.get('key3')).toBeUndefined();
        });

        it('should not throw when removing non-existent key', () => {
            expect(() => store.remove('nonexistent')).not.toThrow();
        });
    });

    describe('clearAll', () => {
        it('should remove all stored items', () => {
            store.set('key4', 'value4');
            store.set('key5', 'value5');
            store.clearAll();
            expect(store.get('key4')).toBeUndefined();
            expect(store.get('key5')).toBeUndefined();
        });

        it('should not throw when clearing empty store', () => {
            expect(() => store.clearAll()).not.toThrow();
        });
    });

    describe('isEmpty', () => {
        it('should return true for empty store', () => {
            expect(store.isEmpty()).toBe(true);
        });

        it('should return false when store has items', () => {
            store.set('key6', 'value6');
            expect(store.isEmpty()).toBe(false);
        });

        it('should return true after clearing all items', () => {
            store.set('key7', 'value7');
            store.clearAll();
            expect(store.isEmpty()).toBe(true);
        });

        it('should return true after removing last item', () => {
            store.set('key8', 'value8');
            store.remove('key8');
            expect(store.isEmpty()).toBe(true);
        });
    });
});

describe('LocalStorageKeyValueStore', () => {
    const localStorage = (() => {
        let store: Record<string, string> = {};

        return {
            getItem: jest.fn((key) => (key in store ? store[key] : null)),
            setItem: jest.fn((key, value) => {
                store[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete store[key];
            }),
            clear: jest.fn(() => {
                store = {};
            }),
            key: jest.fn((i) => Object.keys(store)[i] || null),
            get length() {
                return Object.keys(store).length;
            }
        };
    })();

    let store: LocalStorageKeyValueStore;
    const namespace = 'test_';

    beforeEach(() => {
        localStorage.clear();
        store = new LocalStorageKeyValueStore(namespace, localStorage as unknown as Storage);
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('isFake', () => {
        it('should return false', () => {
            expect(store.isFake()).toBe(false);
        });
    });

    describe('set and get', () => {
        it('should store and retrieve string values', () => {
            store.set('key1', 'value1');
            expect(store.get('key1')).toBe('value1');
        });

        it('should return undefined for non-existent keys', () => {
            expect(store.get('nonexistent')).toBeUndefined();
        });

        it('should overwrite existing values', () => {
            store.set('key2', 'initial');
            store.set('key2', 'updated');
            expect(store.get('key2')).toBe('updated');
        });

        it('should use namespaced keys in localStorage', () => {
            store.set('key3', 'value3');
            expect(localStorage.getItem('test_key3')).toBe('value3');
        });

        it('should not interfere with other namespaces', () => {
            const otherStore = new LocalStorageKeyValueStore('other_', localStorage as unknown as Storage);
            store.set('key4', 'value4');
            otherStore.set('key4', 'othervalue4');

            expect(store.get('key4')).toBe('value4');
            expect(otherStore.get('key4')).toBe('othervalue4');
        });
    });

    describe('remove', () => {
        it('should remove existing key', () => {
            store.set('key5', 'value5');
            store.remove('key5');
            expect(store.get('key5')).toBeUndefined();
        });

        it('should not throw when removing non-existent key', () => {
            expect(() => store.remove('nonexistent')).not.toThrow();
        });
    });

    describe('clearAll', () => {
        it('should remove all stored items from namespace', () => {
            store.set('key6', 'value6');
            store.set('key7', 'value7');
            store.clearAll();
            expect(store.get('key6')).toBeUndefined();
            expect(store.get('key7')).toBeUndefined();
        });

        it('should not clear items from other namespaces', () => {
            const otherStore = new LocalStorageKeyValueStore('other_', localStorage as unknown as Storage);
            store.set('key8', 'value8');
            otherStore.set('key8', 'othervalue8');

            store.clearAll();
            expect(store.get('key8')).toBeUndefined();
            expect(otherStore.get('key8')).toBe('othervalue8');
        });
    });

    describe('isEmpty', () => {
        it('should return true for empty store', () => {
            expect(store.isEmpty()).toBe(true);
        });

        it('should return false when store has items', () => {
            store.set('key9', 'value9');
            expect(store.isEmpty()).toBe(false);
        });

        it('should return true after clearing all items', () => {
            store.set('key10', 'value10');
            store.clearAll();
            expect(store.isEmpty()).toBe(true);
        });

        it('should return true after removing last item', () => {
            store.set('key11', 'value11');
            store.remove('key11');
            expect(store.isEmpty()).toBe(true);
        });
    });

    describe('namespace handling', () => {
        it('should handle empty namespace correctly', () => {
            const nsStore = new LocalStorageKeyValueStore('', localStorage as unknown as Storage);
            nsStore.set('key12', 'value12');
            expect(localStorage.getItem('key12')).toBe('value12');
        });

        it('should handle special characters in namespace', () => {
            const nsStore = new LocalStorageKeyValueStore('user:1/', localStorage as unknown as Storage);
            nsStore.set('key13', 'value13');
            expect(localStorage.getItem('user:1/key13')).toBe('value13');
        });
    });
});
