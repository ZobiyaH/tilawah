/// <reference lib="webworker" />
import * as googleAnalytics from 'workbox-google-analytics';

googleAnalytics.initialize({
  parameterOverrides: {
    'ep.network_status': 'offline_replay',
  },
  hitFilter: (params: URLSearchParams) => {
    const qt = Number(params.get('qt') || 0);
    const queueTimeSec = Math.round(qt / 1000);
    params.set('epn.queue_time', String(queueTimeSec));
  },
});
