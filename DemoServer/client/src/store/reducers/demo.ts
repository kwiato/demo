import { modifyState } from "../state";
import { DemoAction } from "../actions/demo";
import { LocationChangeAction } from "connected-react-router";
import { matchDemoPath, matchDemoWithWalkthroughPath } from "../../utils/paths";
import { DemoState, defaultLanguage } from "../state/demo";
import { DemoEntry, WalkthroughEntry } from "../state/models";
import { Progress } from "../../utils/localStorage/Progress";
import { selectIsLastWalkthroughActive } from "../selectors/walkthroughs";
import { selectDemoVersionInfo } from "../selectors/demos";
import { NavigationAction } from "../actions/navigation";

const initialState: DemoState = {
    language: defaultLanguage,
    categorySlug: null,
    demoSlug: null,
    wtSlug: null,
    demo: null,
    finishedLoadingDemo: false,
    finishedSettingPrerequisites: false,
    showResultsPanel: false,
    loadingRunResults: false,
    runResults: null,
    showShareMessage: false,
    userProgress: null,
    categoriesForLanguages: [],
    categoriesWithVersions: [],
    loadingContext: false,
    conferenceMode: false
};

const getActiveWalkthroughs = (walkthroughs: WalkthroughEntry[], slug: string) => walkthroughs.map(w =>
    (w.slug === slug)
        ? { ...w, isActive: true }
        : { ...w, isActive: false }
);

const getAllInactiveWalkthroughs = (walkthroughs: WalkthroughEntry[]) =>
    walkthroughs.map(w => ({ ...w, isActive: false }));

const updateWalkthroughAndProgress = (state: DemoState) => {
    const { demo, wtSlug } = state;

    if (!demo) {
        return;
    }

    if (demo.walkthroughs) {
        demo.walkthroughs = wtSlug
            ? getActiveWalkthroughs(demo.walkthroughs, wtSlug)
            : getAllInactiveWalkthroughs(demo.walkthroughs);
    }

    const isLastWalkthroughActive = selectIsLastWalkthroughActive(state);

    if (isLastWalkthroughActive) {
        const demoVersionInfo = selectDemoVersionInfo(state);
        Progress.save(demoVersionInfo);
    }
};

export function demoReducer(state: DemoState = initialState,
                            action: DemoAction | LocationChangeAction | NavigationAction
): DemoState {
    switch (action.type) {
        case "DEMO_GET_CONTEXT_REQUEST":
            return modifyState(state, s => {
                s.userProgress = Progress.get();
                s.loadingContext = true;
            });

        case "DEMO_GET_CONTEXT_SUCCESS":
            return modifyState(state, s => {
                const { result } = action;
                const { categoriesWithVersions, conferenceMode, categoriesForLanguages } = result;

                s.categoriesForLanguages = categoriesForLanguages;
                s.categoriesWithVersions = categoriesWithVersions;
                s.conferenceMode = conferenceMode;
                s.userProgress = Progress.get();
                s.loadingContext = false;
            });

        case "DEMO_REFRESH_PROGRESS":
            return modifyState(state, s => {
                s.userProgress = Progress.get();
            });

        case "DEMO_GET_METADATA_REQUEST":
            return modifyState(state, s => s.finishedLoadingDemo = false);

        case "DEMO_GET_METADATA_SUCCESS":
            return modifyState(state, s => {
                s.finishedLoadingDemo = true;
                s.demo = action.result as DemoEntry;

                updateWalkthroughAndProgress(s);
            });

        case "DEMO_GET_METADATA_FAILURE":
            return modifyState(state, s => {
                s.finishedLoadingDemo = true;
            });

        case "@@router/LOCATION_CHANGE":
            return modifyState(state, s => {
                const pathParams = matchDemoWithWalkthroughPath(action) || matchDemoPath(action);

                if (pathParams) {
                    s.categorySlug = pathParams.category;
                    s.demoSlug = pathParams.demo;
                    s.wtSlug = pathParams.wtSlug;
                    s.language = pathParams.language || defaultLanguage;
                }

                updateWalkthroughAndProgress(s);
            });

        case "DEMO_SET_PREREQUISITES_REQUEST":
            return modifyState(state, s => s.finishedSettingPrerequisites = false);

        case "DEMO_SET_PREREQUISITES_FAILURE":
        case "DEMO_SET_PREREQUISITES_SUCCESS":
            return modifyState(state, s => s.finishedSettingPrerequisites = true);

        case "DEMO_RUN_REQUEST":
            return modifyState(state, s => {
                s.showResultsPanel = true;
                s.loadingRunResults = true;
            });

        case "DEMO_RUN_SUCCESS":
            return modifyState(state, s => {
                s.loadingRunResults = false;
                s.runResults = action.results;
                s.userProgress = Progress.get();
            });

        case "DEMO_RUN_FAILURE":
            return modifyState(state, s => {
                s.loadingRunResults = false;
            });

        case "DEMO_HIDE_RESULTS":
            return modifyState(state, s => {
                s.showResultsPanel = false;
            });

        case "DEMO_TOGGLE_SHARE_MESSAGE":
            return modifyState(state, s => {
                s.showShareMessage = action.show;
            });

        case "NAVIGATION_WENT_TO_MAIN_PAGE":
            return modifyState(state, s => {
                s.demo = null;
                s.showResultsPanel = false;
                s.runResults = null;
                s.demoSlug = null;
                s.categorySlug = null;
            });

        case "NAVIGATION_WENT_TO_DEMO_PAGE":
            return modifyState(state, s => {
                const { language } = action;

                s.showResultsPanel = false;
                s.runResults = null;
                s.language = language || defaultLanguage;
            });
    }

    return state;
}
