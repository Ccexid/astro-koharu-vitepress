export const API_DEFAULTS = {
  timeoutMs: 15_000,
  randomImageTimeoutMs: 30_000,
  upstreams: {
    bilibili: 'https://api.bilibili.com',
    bangumi: 'https://api.bgm.tv/v0',
    uapi: 'https://uapis.cn',
  },
  referers: {
    bilibili: 'https://www.bilibili.com/',
    uapi: 'https://uapis.cn/',
  },
  paths: {
    bilibiliPrefix: '/bili',
    bilibiliFollow: '/x/space/bangumi/follow/list',
    uapiPrefix: '/uapi',
    uapiSaying: '/api/v1/saying',
    uapiRandomImage: '/api/v1/random/image',
  },
} as const
