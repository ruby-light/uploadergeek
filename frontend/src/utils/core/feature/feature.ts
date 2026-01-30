import {useReducer, type Reducer} from 'react';
import type {Record_Partial} from '../typescript/typescriptAddons';

/**
==========================================
FStatus
==========================================
*/

type FStatus = {
    inProgress: boolean;
    loaded: boolean;
};
const defaultFStatus: FStatus = {inProgress: false, loaded: false};

/**
==========================================
FError
==========================================
*/

type FError = {
    isError: boolean;
    error?: Error;
};
const defaultFError: FError = {isError: false, error: undefined};

/**
==========================================
Feature
==========================================
*/

export type Feature = {
    status: FStatus;
    error: FError;
};

type FeaturePartial = Record_Partial<Feature>;

function getDefaultFeature(): Feature {
    return {
        status: {...defaultFStatus},
        error: {...defaultFError}
    };
}
export const useFeature = () => useReducer<Reducer<Feature, FeaturePartial>, void>(simpleFeatureReducer, undefined, () => getDefaultFeature());

/**
==========================================
Reducer
==========================================
*/

function simpleFeatureReducer(state: any, newState: any) {
    if (newState == undefined) {
        return {};
    }
    const result = {...state};
    Object.entries(newState).forEach(([key, value]) => {
        if (value == undefined) {
            result[key] = undefined;
        } else {
            result[key] = {
                ...result[key],
                ...value
            };
        }
    });
    return result;
}
