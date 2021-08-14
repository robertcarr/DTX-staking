import {usePlugin} from '@nomiclabs/buidler/config';

// tslint:disable-next-line: no-default-import
import solcconfig from './solcconfig.json';

usePlugin('@nomiclabs/buidler-truffle5');
usePlugin('@nomiclabs/buidler-solhint');

const config = {
  defaultNetwork: 'buidlerevm',
  solc: solcconfig,
  analytics: {
    enabled: false,
  },
};

// tslint:disable-next-line: no-default-export
export default config;
