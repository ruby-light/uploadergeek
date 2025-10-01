import {jsonStringify} from '../core/json/json';
import type {LogEntry} from './Logger';

type LogSink = {
    write(entry: LogEntry): void;
    flush?(): void;
};

export class LocalStorageSink implements LogSink {
    private key = 'dev-only-logs';
    private buffer: Array<LogEntry> = [];
    private flushTimer: any;

    constructor(
        private maxMessages: number = 10000,
        /**
         * how many logs to buffer
         */
        private batchSize: number = 20,
        /**
         * max delay before flush (ms)
         */
        private flushInterval: number = 2000
    ) {}

    write(entry: LogEntry) {
        this.buffer.push(entry);

        /**
         * Flush immediately if batchSize reached
         */
        if (this.buffer.length >= this.batchSize) {
            this.flush();
        } else if (!this.flushTimer && this.flushInterval > 0) {
            /**
             * Schedule a delayed flush
             */
            this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
        }
    }

    readAll(): Array<LogEntry> {
        const raw = localStorage.getItem(this.key);
        return raw ? JSON.parse(raw) : [];
    }

    flush() {
        if (this.buffer.length === 0) {
            return;
        }

        const logs = this.readAll();
        logs.push(...this.buffer);
        this.buffer = [];

        /**
         * Trim to maxMessages
         */
        const sliced = logs.length > this.maxMessages ? logs.slice(-this.maxMessages) : logs;

        localStorage.setItem(this.key, jsonStringify(sliced));

        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
    }
}
