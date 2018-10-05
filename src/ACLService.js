const ACLError = require('./ACLError')

class ACLService {
  constructor () {
    this.logger = false
    this._ruleCache = new Map()
    this._resultCache = new Map()
    this._importInProgress = false
  }

  import (configJSON) {
    this._importInProgress = true
    for (let role of Object.keys(configJSON)) {
      if (role[0] === '@') {
        this._log('warn', `Role ignored: ${role.substr(1)}`)
        continue
      }
      if (!this.hasRole(role)) {
        this.createRole(role)
      }
      for (let rule of configJSON[role].sort()) {
        if (rule[0] === '@') {
          this._log('warn', `Rule ignored: ${role}\\${rule.substr(1)}`)
          continue
        }
        this.createRule(rule, role)
      }
    }
    // clear if ACL rules ready
    this._importInProgress = false
    this.clearResultCache()
    this._log('info', 'Import completed')
  }

  createRole (role) {
    if (!/^[a-z0-9-_]+$/i.test(role)) {
      this._log('error', `Invalid character(s) in role name: ${role}`)
      return false
    }
    if (this._ruleCache.has(role)) {
      this._log('error', `Role creation error: ${role} (role already exists)`)
      return false
    }

    this._ruleCache.set(role, {accept: [], reject: []})
    this._log('debug', `Role created: ${role}`)
    return true
  }

  hasRole (role) {
    return this._ruleCache.has(role)
  }

  createRule (rule, role) {
    if (!/^!?[a-z0-9*-._]+$/i.test(rule)) {
      this._log('error', `Invalid character in rule name: ${role}\\${rule}`)
      return false
    }
    if (!this._ruleCache.has(role)) {
      this._log('error', `Rule creation error: ${role}\\${rule} (role not exists)`)
      return false
    }

    try {
      let rejectRule = rule[0] === '!'
      let ruleTarget = rejectRule
        ? this._ruleCache.get(role).reject
        : this._ruleCache.get(role).accept
      let expRule = rejectRule ? rule.substr(1) : rule
      let ruleRegExp = new RegExp('^' + expRule.replace('.', '\\.').replace('*', '.*') + '$', 'i')

      for (let storedRule of ruleTarget) {
        if (storedRule.toString() === ruleRegExp.toString()) {
          throw new Error('rule already exists')
        }
      }
      ruleTarget.push(ruleRegExp)
      this._log('debug', `Rule created: ${role}\\${rule}`)
      if (!this._importInProgress) {
        this.clearResultCache()
      }
      return true
    } catch (error) {
      this._log('error', `Rule creation error: ${role}\\${rule} (${error.message})`)
    }
    return false
  }

  clear () {
    this._ruleCache.clear()
    this._resultCache.clear()
    this._log('info', 'Rules and result cache cleared')
  }

  clearResultCache () {
    if (this._resultCache.size > 0) {
      this._resultCache.clear()
      this._log('info', 'Result cache cleared')
    }
  }

  get roleList () {
    return [...this._ruleCache.keys()]
  }

  isAllowed (access, role) {
    if (typeof access !== 'string' || access.length === 0) {
      this._log('warn', `Missing access argument: isAllowed() resolves to false`)
      return false
    }
    if (typeof role !== 'string' || access.length === 0) {
      this._log('warn', `Missing role argument: isAllowed(${access}) resolves to false`)
      return false
    }
    if (!this._ruleCache.has(role)) {
      this._log('warn', `Role not found: '${role}' not in ${this.roleList}`)
      return false
    }
    if (!/^[a-z0-9-._]+$/i.test(access)) {
      this._log('error', `Invalid character in access parameter: ${role}\\${access}`)
      return false
    }
    access = access.replace(/\s+/g, '')
    let search = `${role}\\${access}`
    let result = false
    if (this._resultCache.has(search)) {
      result = this._resultCache.get(search)
      if (result) {
        this._log('debug', `Rule accepted: ${role}\\${access} (from cache)`)
      } else {
        this._log('debug', `Rule declined: ${role}\\${access} (from cache)`)
      }
      return result
    }
    for (let rule of this._ruleCache.get(role).accept) {
      if (rule.test(access)) {
        result = true
        break
      }
    }
    if (result) {
      for (let rule of this._ruleCache.get(role).reject) {
        if (rule.test(access)) {
          result = false
          break
        }
      }
    }
    this._resultCache.set(search, result)
    if (result) {
      this._log('debug', `Rule accepted: ${role}\\${access}`)
    } else {
      this._log('debug', `Rule declined: ${role}\\${access}`)
    }
    return result
  }

  areAllowed (accessList, role) {
    if (!(accessList instanceof Array)) {
      this._log('error', 'Access list is not an array (request rejected)')
      return false
    }
    if (accessList.length === 0) return false
    let access = accessList.sort().join('&').replace(/\s+/g, '')
    let search = `${role}\\${access}`
    let result = true
    if (this._resultCache.has(search)) {
      result = this._resultCache.get(search)
      if (result) {
        this._log('debug', `Rule accepted: ${role}\\${access} (from cache)`)
      } else {
        this._log('debug', `Rule declined: ${role}\\${access} (from cache)`)
      }
      return result
    }
    for (let access of accessList) {
      if (!this.isAllowed(access, role)) {
        result = false
        break
      }
    }
    this._resultCache.set(search, result)
    if (result) {
      this._log('debug', `Rule accepted: ${role}\\${access}`)
    } else {
      this._log('debug', `Rule declined: ${role}\\${access}`)
    }
    return result
  }

  anyAllowed (accessList, role) {
    if (!(accessList instanceof Array)) {
      this._log('error', 'Access list is not an array (request rejected)')
      return false
    }
    let access = accessList.sort().join('|').replace(/\s+/g, '')
    let search = `${role}\\${access}`
    let result = false
    if (this._resultCache.has(search)) {
      result = this._resultCache.get(search)
      if (result) {
        this._log('debug', `Rule accepted: ${role}\\${access} (cached)`)
      } else {
        this._log('debug', `Rule declined: ${role}\\${access} (cached)`)
      }
      return result
    }
    for (let access of accessList) {
      if (this.isAllowed(access, role)) {
        result = true
        break
      }
    }
    this._resultCache.set(search, result)
    if (result) {
      this._log('debug', `Rule accepted: ${role}\\${access}`)
    } else {
      this._log('debug', `Rule declined: ${role}\\${access}`)
    }
    return result
  }

  _log (level, message) {
    if (this.logger instanceof Object &&
      this.logger[level] instanceof Function) {
      this.logger[level](message)
    } else if (this.logger instanceof Function) {
      this.logger(level, message)
    }
    if (level === 'error') {
      throw new ACLError(message)
    }
  }
}

module.exports = ACLService
