/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import escapeStringRegexp from 'escape-string-regexp';
import { createSelector } from 'reselect';
import { ensureExists } from '../utils/flow';
import { urlFromState } from '../app-logic/url-handling';
import * as CommittedRanges from '../profile-logic/committed-ranges';

import type { ThreadIndex, Pid } from '../types/profile';
import type { TransformStack } from '../types/transforms';
import type {
  Action,
  TimelineType,
  DataSource,
  ImplementationFilter,
} from '../types/actions';
import type { TabSlug } from '../app-logic/tabs-handling';
import type { UrlState } from '../types/state';
import type { Selector, DangerousSelectorWithArguments } from '../types/store';
import type { StartEndRange } from '../types/units';
import type { TrackIndex } from '../types/profile-derived';

import urlStateReducer from '../reducers/url-state';

/**
 * Various simple selectors into the UrlState.
 */
export const getUrlState: Selector<UrlState> = (state): UrlState =>
  state.urlState;
export const getProfileSpecificState: Selector<*> = state =>
  getUrlState(state).profileSpecific;
export const getDataSource: Selector<DataSource> = state =>
  getUrlState(state).dataSource;
export const getHash: Selector<string> = state => getUrlState(state).hash;
export const getProfileUrl: Selector<string> = state =>
  getUrlState(state).profileUrl;
export const getProfilesToCompare: Selector<string[] | null> = state =>
  getUrlState(state).profilesToCompare;
export const getProfileNameFromUrl: Selector<string> = state =>
  getUrlState(state).profileName;
export const getIsNewlyPublished: Selector<boolean> = state =>
  getUrlState(state).isNewlyPublished;
export const getAllCommittedRanges: Selector<StartEndRange[]> = state =>
  getProfileSpecificState(state).committedRanges;
export const getImplementationFilter: Selector<ImplementationFilter> = state =>
  getProfileSpecificState(state).implementation;
export const getInvertCallstack: Selector<boolean> = state =>
  getProfileSpecificState(state).invertCallstack;
export const getShowJsTracerSummary: Selector<boolean> = state =>
  getProfileSpecificState(state).showJsTracerSummary;
export const getCurrentSearchString: Selector<string> = state =>
  getProfileSpecificState(state).callTreeSearchString;
export const getMarkersSearchString: Selector<string> = state =>
  getProfileSpecificState(state).markersSearchString;
export const getNetworkSearchString: Selector<string> = state =>
  getProfileSpecificState(state).networkSearchString;
export const getSelectedTab: Selector<TabSlug> = state =>
  getUrlState(state).selectedTab;
export const getSelectedThreadIndexOrNull: Selector<ThreadIndex | null> = state =>
  getProfileSpecificState(state).selectedThread;
export const getSelectedThreadIndex: Selector<ThreadIndex> = state =>
  ensureExists(
    getSelectedThreadIndexOrNull(state),
    'Attempted to get a thread index before a profile was loaded.'
  );
export const getTimelineType: Selector<TimelineType> = state =>
  getProfileSpecificState(state).timelineType;

/**
 * Simple selectors for tracks and track order.
 */
export const getLegacyThreadOrder: Selector<ThreadIndex[] | null> = state =>
  getProfileSpecificState(state).legacyThreadOrder;
export const getLegacyHiddenThreads: Selector<ThreadIndex[] | null> = state =>
  getProfileSpecificState(state).legacyHiddenThreads;
export const getGlobalTrackOrder: Selector<TrackIndex[]> = state =>
  getProfileSpecificState(state).globalTrackOrder;
export const getHiddenGlobalTracks: Selector<Set<TrackIndex>> = state =>
  getProfileSpecificState(state).hiddenGlobalTracks;
export const getHiddenLocalTracksByPid: Selector<
  Map<Pid, Set<TrackIndex>>
> = state => getProfileSpecificState(state).hiddenLocalTracksByPid;
export const getLocalTrackOrderByPid: Selector<
  Map<Pid, TrackIndex[]>
> = state => getProfileSpecificState(state).localTrackOrderByPid;

/**
 * This selector does a simple lookup in the set of hidden tracks for a PID, and ensures
 * that a TrackIndex is selected correctly. This makes it easier to avoid doing null
 * checks everywhere.
 */
export const getHiddenLocalTracks: DangerousSelectorWithArguments<
  Set<TrackIndex>,
  Pid
> = (state, pid) =>
  ensureExists(
    getHiddenLocalTracksByPid(state).get(pid),
    'Unable to get the hidden tracks from the given pid'
  );

/**
 * This selector gets the local track order for a PID, and ensures that one is
 * selected correctly. This makes it easier to avoid doing null checks everywhere.
 */
export const getLocalTrackOrder: DangerousSelectorWithArguments<
  TrackIndex[],
  Pid
> = (state, pid) =>
  ensureExists(
    getLocalTrackOrderByPid(state).get(pid),
    'Unable to get the track order from the given pid'
  );

/**
 * Search strings filter a thread to only samples that match the strings.
 */
export const getSearchStrings: Selector<string[] | null> = createSelector(
  getCurrentSearchString,
  searchString => {
    if (!searchString) {
      return null;
    }
    const result = searchString
      .split(',')
      .map(part => part.trim())
      .filter(part => part);

    if (result.length) {
      return result;
    }

    return null;
  }
);

/**
 * A RegExp can be used for searching and filtering the thread's samples.
 */
export const getSearchStringsAsRegExp: Selector<RegExp | null> = createSelector(
  getSearchStrings,
  strings => {
    if (!strings || !strings.length) {
      return null;
    }
    const regexpStr = strings.map(escapeStringRegexp).join('|');
    return new RegExp(regexpStr, 'gi');
  }
);

// Pre-allocate an array to help with strict equality tests in the selectors.
const EMPTY_TRANSFORM_STACK = [];

export const getTransformStack: DangerousSelectorWithArguments<
  TransformStack,
  ThreadIndex
> = (state, threadIndex) => {
  return (
    getProfileSpecificState(state).transforms[threadIndex] ||
    EMPTY_TRANSFORM_STACK
  );
};

/**
 * The URL predictor is used to generate a link for an uploaded profile, to predict
 * what the URL will be.
 */
export const getUrlPredictor: Selector<
  (Action | Action[]) => string
> = createSelector(
  getUrlState,
  (oldUrlState: UrlState) => (actionOrActionList: Action | Action[]) => {
    const actionList: Action[] = Array.isArray(actionOrActionList)
      ? actionOrActionList
      : [actionOrActionList];
    const newUrlState = actionList.reduce(urlStateReducer, oldUrlState);
    return urlFromState(newUrlState);
  }
);

/**
 * Get the current path for a zip file that is being used.
 */
export const getPathInZipFileFromUrl: Selector<string | null> = state =>
  getUrlState(state).pathInZipFile;

/**
 * For now only provide a name for a profile if it came from a zip file.
 */
export const getProfileName: Selector<null | string> = createSelector(
  getProfileNameFromUrl,
  getPathInZipFileFromUrl,
  (profileName, pathInZipFile) => {
    if (profileName) {
      return profileName;
    }
    const matchResult = pathInZipFile.match(/(?:[^/]+\/)?[^/]+$/);
    if (matchResult !== null) {
      return matchResult[0];
    }
    return null;
  }
);

/**
 * This selector transforms the committed ranges into a list of labels that can
 * be displayed in the UI.
 */
export const getCommittedRangeLabels: Selector<string[]> = createSelector(
  getAllCommittedRanges,
  CommittedRanges.getCommittedRangeLabels
);
