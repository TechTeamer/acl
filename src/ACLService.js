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
      if (!this._importInProgress) {
        this._log('info', `New rule created: ${role}\\${rule}`)
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

  isAllowed (access, role) {
    if (typeof access !== 'string' || access.length === 0) {
      this._log('error', 'Access argument is required (request rejected)')
      return false
    }
    if (typeof role !== 'string' || access.length === 0) {
      this._log('error', 'Role argument is required (request rejected)')
      return false
    }
    if (!this._ruleCache.has(role)) {
      this._log('error', `Role not found: ${role}`)
      return false
    }
    if (!/^[a-z0-9-._]+$/i.test(access)) {
      this._log('error', `Invalid character in access parameter: ${role}\\${access}`)
      return false
    }

    access = access.replace(/\s+/g, '')
    let search = `${role}\\${access}`
    if (this._resultCache.has(search)) {
      return this._resultCache.get(search)
    }
    let result = false
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
    if (this._resultCache.has(search)) {
      return this._resultCache.get(search)
    }
    let result = true
    for (let access of accessList) {
      if (!this.isAllowed(access, role)) {
        result = false
        break
      }
    }
    this._resultCache.set(search, result)
    return result
  }

  anyAllowed (accessList, role) {
    if (!(accessList instanceof Array)) {
      this._log('error', 'Access list is not an array (request rejected)')
      return false
    }
    let access = accessList.sort().join('|').replace(/\s+/g, '')
    let search = `${role}\\${access}`
    if (this._resultCache.has(search)) {
      return this._resultCache.get(search)
    }
    let result = false
    for (let access of accessList) {
      if (this.isAllowed(access, role)) {
        result = true
        break
      }
    }
    this._resultCache.set(search, result)
    return result
  }

  _log (level, message) {
    if (this.logger instanceof Object &&
      this.logger[level] instanceof Function) {
      this.logger[level](message)
    } else if (this.logger instanceof Function) {
      this.logger(message, level)
    }
    if (level === 'error') {
      throw new ACLError(message)
    }
  }
}

module.exports = ACLService
