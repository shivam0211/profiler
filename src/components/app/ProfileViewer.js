/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import React, { PureComponent } from 'react';
import explicitConnect from '../../utils/connect';
import DetailsContainer from './DetailsContainer';
import ProfileFilterNavigator from './ProfileFilterNavigator';
import MenuButtons from './MenuButtons';
import SymbolicationStatusOverlay from './SymbolicationStatusOverlay';
import { returnToZipFileList } from '../../actions/zipped-profiles';
import { getProfileName } from '../../selectors/url-state';
import Timeline from '../timeline';
import { getHasZipFile } from '../../selectors/zipped-profiles';

import type {
  ExplicitConnectOptions,
  ConnectedProps,
} from '../../utils/connect';

require('./ProfileViewer.css');

type StateProps = {|
  +profileName: string | null,
  +hasZipFile: boolean,
|};

type DispatchProps = {|
  +returnToZipFileList: typeof returnToZipFileList,
|};

type Props = ConnectedProps<{||}, StateProps, DispatchProps>;

class ProfileViewer extends PureComponent<Props> {
  render() {
    const { hasZipFile, profileName, returnToZipFileList } = this.props;
    return (
      <div className="profileViewer">
        <div className="profileViewerTopBar">
          {hasZipFile ? (
            <button
              type="button"
              className="profileViewerZipButton"
              title="View all files in the zip file"
              onClick={returnToZipFileList}
            />
          ) : null}
          {profileName ? (
            <div className="profileViewerName">{profileName}</div>
          ) : null}
          <ProfileFilterNavigator />
          {/*
            * Define a spacer in the middle that will shrink based on the availability
            * of space in the top bar. It will shrink away before any of the items
            * with actual content in them do.
            */}
          <div className="profileViewerSpacer" />
          <MenuButtons />
        </div>
        <Timeline />
        <DetailsContainer />
        <SymbolicationStatusOverlay />
      </div>
    );
  }
}

const options: ExplicitConnectOptions<{||}, StateProps, DispatchProps> = {
  mapStateToProps: state => ({
    profileName: getProfileName(state),
    hasZipFile: getHasZipFile(state),
  }),
  mapDispatchToProps: {
    returnToZipFileList,
  },
  component: ProfileViewer,
};

export default explicitConnect(options);
