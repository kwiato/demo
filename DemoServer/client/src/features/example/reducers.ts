import { ExampleAction } from "./actions";
import { FETCH_RESULT_REQUEST, FETCH_RESULT_SUCCESS, FETCH_RESULT_FAILURE } from "./actionNames";
import { modifyState, ExampleState } from "../../store/state";

export function exampleReducer(state: ExampleState = { loading: false, text: null }, action: ExampleAction): ExampleState {
    switch (action.type) {
        case FETCH_RESULT_REQUEST:
            return modifyState(state, s => s.loading = true);

        case FETCH_RESULT_SUCCESS:
            return modifyState(state, s => {
                s.loading = false;
                s.text = action.result.text;
            });

        case FETCH_RESULT_FAILURE:
            return state;
    }
    return state;
}