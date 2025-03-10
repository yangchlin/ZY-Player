import Dexie from 'dexie'
import { setting, sites, localKey, iptv, recommandations } from './initData'

const db = new Dexie('zy')

db.version(4).stores({
  search: '++id, keywords',
  iptvSearch: '++id, keywords',
  setting: 'id, theme, site, shortcut, view, externalPlayer, searchAllSites, excludeRootClasses, excludeR18Films, forwardTimeInSec, starViewMode, recommandationViewMode',
  shortcut: 'name, key, desc',
  star: '++id, [key+ids], site, name, detail, index, rate, hasUpdate',
  recommandation: '++id, [key+ids], site, name, detail, index, rate, hasUpdate',
  sites: '++id, key, name, api, download, isActive, group',
  history: '++id, [site+ids], name, type, year, index, time',
  mini: 'id, site, ids, name, index, time',
  iptv: '++id, name, url, group'
})

db.on('populate', () => {
  db.setting.bulkAdd(setting)
  db.sites.bulkAdd(sites)
  db.shortcut.bulkAdd(localKey)
  db.iptv.bulkAdd(iptv)
  db.recommandation.bulkAdd(recommandations)
})

db.open()

export default db
