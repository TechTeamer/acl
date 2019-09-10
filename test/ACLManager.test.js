const assert = require('assert')
const { ACLManager, ACLService } = require('./../index')
const acl1 = new ACLService()
const acl2 = new ACLService()
let acm

// Lowest ACL level
const acl0Config = {
  "admin": [ // We will never get here
    "*"
  ],
  "operator": [  // Falls back here from acl2 then acl1
    "calls.accept"
  ]
}

// Lower precedence ACL
acl1.import({
  "admin": [ // We will never get here
    "users.*",
    "system.*"
  ],
  "supervisor": [ // Falls back here from acl2
    "users.*",
    "!users.delete",
    "system.*",
    "!system.shutdown",
    "@ignored"
  ]
})

// Higher precedence ACL
acl2.import({
  "admin": [
    "users.*",
  ]
})

describe('ACLManager.constructor', function () {
  it('Can construct a new ACLManager', function () {
    acm = new ACLManager()
  })
})

describe('ACLManager.importConfig', function () {
  it('Import ACL config', function () {
    assert.doesNotThrow(function () {
      acm.importConfig(acl0Config)
    })
  })
})

describe('ACLManager.import', function () {
  it('Import multiple ACLs', function () {
    assert.doesNotThrow(function () {
      acm.import(acl1)
    })
    assert.doesNotThrow(function () {
      acm.import(acl2)
    })
  })
  it('Throws an Error when trying to import a Non-ACL object', function () {
    assert.throws(function () {
      acm.import({
        thisIsAnACL: false
      })
    })
  })
})

describe('ACLManager.roleList', function () {
  it('Can list every role across all ACL', function () {
    assert.ok(Array.isArray(acm.roleList))
    assert.ok(acm.roleList.includes('admin'))
    assert.ok(acm.roleList.includes('supervisor'))
    assert.ok(acm.roleList.includes('operator'))
    assert.ok(!acm.roleList.includes('missingRole'))
  })
})

describe('ACL.hasRole', function () {
  it('Positive result when role exists: \'admin\'', function () {
    assert.ok(acm.hasRole('admin'))
  })
  it('Negative result when role not exists: \'missingRole\'', function () {
    assert.ok(!acm.hasRole('missingRole'))
  })
})

describe('ACLManager.getACLForRole', function () {
  it('Finds existing role', function () {
    assert.ok(acm.getACLForRole('admin') instanceof ACLService)
  })
  it('Finds the role in the ACL with the higher precedence first', function () {
    assert.ok(acm.getACLForRole('admin') === acl2)
  })
  it('Falls back to lower precedence ACLs when the role is not present in the ACL with the higher precedence', function () {
    assert.ok(acm.getACLForRole('supervisor') === acl1)
  })
  it('Returns false if the role is missing', function () {
    assert.ok(acm.getACLForRole('missingRole') === false)
  })
})

describe('ACLManager.isAllowed', function () {
  it('Higher precedence ACL returns true for existing rules', function () {
    assert.ok(acm.isAllowed('users.delete', 'admin'))
  })
  it('Higher precedence ACL returns false for missing rules (and does not fallback to lower precedence ACL)', function () {
    assert.ok(!acm.isAllowed('system.shutdown', 'admin'))
  })
  it('Lower precedence ACL returns true when role is missing from higher precedence ACL', function () {
    assert.ok(acm.isAllowed('system.start', 'supervisor'))
  })
  it('Lower precedence ACL returns false when role is missing from higher precedence ACL', function () {
    assert.ok(!acm.isAllowed('system.shutdown', 'supervisor'))
  })
  it('Returns false if the role is missing', function () {
    assert.ok(!acm.isAllowed('system.shutdown', 'missingRole'))
  })
})

describe('ACLManager.areAllowed', function () {
  it('Positive result for higher ACL', function () {
    assert.ok(acm.areAllowed(['users.delete', 'users.modify'], 'admin'))
  })
  it('Negative result for higher ACL', function () {
    assert.ok(!acm.areAllowed(['system.shutdown'], 'admin'))
  })
  it('Positive result for lower ACL', function () {
    assert.ok(acm.areAllowed(['users.create', 'users.modify'], 'supervisor'))
  })
  it('Negative result for lower ACL', function () {
    assert.ok(!acm.areAllowed(['users.delete', 'system.shutdown'], 'supervisor'))
  })
  it('Negative result on empty list', function () {
    assert.ok(!acm.areAllowed([], 'admin'))
  })
})

describe('ACLManager.anyAllowed', function () {
  it('Positive result for higher ACL', function () {
    assert.ok(acm.anyAllowed(['users.delete', 'system.shutdown'], 'admin'))
  })
  it('Negative result for higher ACL', function () {
    assert.ok(!acm.anyAllowed(['system.shutdown'], 'admin'))
  })
  it('Positive result for lower ACL', function () {
    assert.ok(acm.anyAllowed(['users.create', 'system.shutdown'], 'supervisor'))
  })
  it('Negative result for lower ACL', function () {
    assert.ok(!acm.anyAllowed(['users.delete', 'system.shutdown'], 'supervisor'))
  })
  it('Negative result on empty list', function () {
    assert.ok(!acm.anyAllowed([], 'admin'))
  })
})

describe('ACLManager.clear', function () {
  it('Clears ACL instances from manager', function () {
    acm.clear()
    assert.ok(acm.aclList.length === 0)
  })
})
