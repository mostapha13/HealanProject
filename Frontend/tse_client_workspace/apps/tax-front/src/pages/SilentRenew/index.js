import { processSilentRenew } from 'redux-oidc';

import * as React from 'react';
function SilentRenew() {
  processSilentRenew();
  console.log('silent renew');
  return <div>aaa</div>;
}
export default SilentRenew;
