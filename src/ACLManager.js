const ACLError = require('./ACLError')
const ACLService = require('./ACLService')

class ACLManager {
  constructor () {
    this.log = false
    this.aclList = []
  }

  set logger (value) {
    this.log = value

    for (const acl of this.aclList) {
      acl.logger = this.log
    }
  }

  get logger () {
    return this.log
  }

  importConfig (configJSON) {
    const acl = new ACLService()
    acl.import(configJSON)

    if (this.log) {
      acl.logger = this.log
    }

    this.import(acl)
  }

  import (acl) {
    if (!(acl instanceof ACLService)) {
      this._log('error', 'Failed to import non-ACL value')
    }

    // The latest ACL takes precedence
    this.aclList.unshift(acl)
  }

  get roleList () {
    // Flattened unique role list array across every acl
    return Array.from(new Set([].concat(...this.aclList.map(acl => acl.roleList))))
  }

  hasRole (role) {
    return this.roleList.includes(role)
  }

  getACLForRole (role) {
    for (let acl of this.aclList) {
      if (acl.roleList.includes(role)) {
        return acl
      }
    }

    return false
  }

  isAllowed (access, role) {
    const acl = this.getACLForRole(role)
    if (!acl) {
      this._log('warn', `Role not found: '${role}' in any ACL`)
      return false
    }

    return acl.isAllowed(access, role)
  }

  areAllowed (accessList, role) {
    const acl = this.getACLForRole(role)
    if (!acl) {
      this._log('warn', `Role not found: '${role}' in any ACL`)
      return false
    }

    return acl.areAllowed(accessList, role)
  }

  anyAllowed (accessList, role) {
    const acl = this.getACLForRole(role)
    if (!acl) {
      this._log('warn', `Role not found: '${role}' in any ACL`)
      return false
    }

    return acl.anyAllowed(accessList, role)
  }

  clear () {
    this.aclList = []
  }

  _log (level, message) {
    if (this.log instanceof Object && this.log[level] instanceof Function) {
      this.log[level](message)
    } else if (this.log instanceof Function) {
      this.log(level, message)
    }

    if (level === 'error') {
      throw new ACLError(message)
    }
  }
}

module.exports = ACLManager
