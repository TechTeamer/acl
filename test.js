const assert = require('assert')
const {AccessControlListService, AccessControlListError} = require('./index')
const ACL = new AccessControlListService()

describe('Initial types and values', function () {
  it('ACL config cache is an empty Map object', function () {
    assert.ok(ACL._ruleCache instanceof Map && ACL._ruleCache.size === 0)
  })
  it('ACL result cache is an empty Map object', function () {
    assert.ok(ACL._resultCache instanceof Map && ACL._resultCache.size === 0)
  })
  it('ACL use exceptions when error occurred (by default)', function () {
    assert.ok(ACL.throws && AccessControlListError instanceof Object)
  })
})

describe('ACL.createRole', function () {
  it('Create new role then check it: \'admin\'', function () {
    assert.ok(ACL.createRole('admin'))
    assert.ok(ACL._ruleCache.has('admin'))
  })
  it('Create new role with same name throws an error', function () {
    assert.throws(function () {
      ACL.createRole('admin')
    }, AccessControlListError)
  })
  it('Create new role with invalid name throws an error', function () {
    assert.throws(function () {
      ACL.createRole('@$admin')
    }, AccessControlListError)
  })
})

describe('ACL.createRule', function () {
  it('Create new accept rule then check it: \'admin\\users.create\'', function () {
    assert.ok(ACL.createRule('users.create', 'admin'))
    assert.ok(function () {
      for (let rule of ACL._ruleCache.get('admin').accept) {
        if (rule instanceof RegExp &&
          rule.toString() === /^users\.create$/i.toString()) return true
      }
    }(), 'Created rule not found as a regular expression')
  })
  it('Create new rule with same description throws an error', function () {
    assert.throws(function () {
      ACL.createRule('users.create', 'admin')
    }, AccessControlListError)
  })
  it('Create new rule with invalid name throws an error', function () {
    assert.throws(function () {
      ACL.createRule('users.@create', 'admin')
    }, AccessControlListError)
  })
  it('Create new rule with missing role throws an error', function () {
    assert.throws(function () {
      ACL.createRule('users.create', 'inv')
    }, AccessControlListError)
  })
  it('Create new accept rule with wildcard character: \'admin\\users.*\'', function () {
    assert.ok(ACL.createRule('users.*', 'admin'))
    assert.ok(function () {
      for (let rule of ACL._ruleCache.get('admin').accept) {
        if (rule instanceof RegExp &&
          rule.toString() === /^users\..*$/i.toString()) return true
      }
    }(), 'Created rule not found as a regular expression')
  })
  it('Create new reject rule then check it: \'admin\\!users.secret\'', function () {
    assert.ok(ACL.createRule('!users.secret', 'admin'))
    assert.ok(function () {
      for (let rule of ACL._ruleCache.get('admin').reject) {
        if (rule instanceof RegExp &&
          rule.toString() === /^users\.secret$/i.toString()) return true
      }
    }(), 'Created rule not found as a regular expression')
  })
})

describe('ACL.hasRole', function () {
  it('Positive result when role exists: \'admin\'', function () {
    assert.ok(ACL.hasRole('admin'))
  })
  it('Negative result when role not exists: \'operator\'', function () {
    assert.ok(!ACL.hasRole('operator'))
  })
})

describe('ACL.import', function () {
  it('Import json role/rule structure (append, without overwrite)', function () {
    assert.doesNotThrow(function () {
      ACL.import({"supervisor": ["!users.create", "users.secret"]})
    })
  })
  it('Accept rule created: \'supervisor\\users.secret\'', function () {
    assert.ok(ACL._ruleCache.has('supervisor'))
    assert.ok(function () {
      for (let rule of ACL._ruleCache.get('supervisor').accept) {
        if (rule instanceof RegExp &&
          rule.toString() === /^users\.secret$/i.toString()) return true
      }
    }(), 'Created rule not found as a regular expression')
  })
  it('Reject rule created: \'supervisor\\!users.create\'', function () {
    assert.ok(ACL._ruleCache.has('supervisor'))
    assert.ok(function () {
      for (let rule of ACL._ruleCache.get('supervisor').reject) {
        if (rule instanceof RegExp &&
          rule.toString() === /^users\.create$/i.toString()) return true
      }
    }(), 'Created rule not found as a regular expression')
  })
})

describe('ACL.isAllowed', function () {
  it('Positive result on accept rule: \'admin\\users.create\'', function () {
    assert.ok(ACL.isAllowed('users.create', 'admin'))
  })
  it('Negative result on reject rule: \'supervisor\\users.create\'', function () {
    assert.ok(!ACL.isAllowed('users.create', 'supervisor'))
  })
  it('Positive result if any accept rule match (users.*): \'admin\\users.delete\'', function () {
    assert.ok(ACL.isAllowed('users.delete', 'admin'))
  })
  it('Negative result if any reject rule match (reject first): \'admin\\users.secret\'', function () {
    assert.ok(!ACL.isAllowed('users.secret', 'admin'))
  })
  it('Negative result if no rules match: \'supervisor\\users.delete\'', function () {
    assert.ok(!ACL.isAllowed('users.delete', 'supervisor'))
  })
  it('When role is missing throws an error: \'operator\\users.view\'', function () {
    assert.throws(function () {
      ACL.isAllowed('users.view', 'operator')
    }, AccessControlListError)
  })
  it('When rule includes any wildcard character throws an error: \'admin\\users.*\'', function () {
    assert.throws(function () {
      ACL.isAllowed('users.*', 'admin')
    }, AccessControlListError)
  })
})

describe('ACL.clearResultCache', function () {
  it('ACL result cache is an empty Map object', function () {
    ACL.clearResultCache()
    assert.ok(ACL._resultCache instanceof Map &&
      ACL._resultCache.size === 0)
  })
})

describe('ACL.clear', function () {
  it('ACL config and result cache are empty Map objects', function () {
    ACL.clear()
    assert.ok(ACL._ruleCache instanceof Map &&
      ACL._ruleCache.size === 0 &&
      ACL._resultCache instanceof Map &&
      ACL._resultCache.size === 0)
  })
})
