The ACL Package
=============

* [Install](#install)
* [Usage options](#usage-options)
* [ACLService](#aclservice)
  * [Define rules](#define-rules)
  * [Create rules](#create-rules)
  * [Import rules](#import-rules)
  * [Setup logging](#setup-logging)
  * [Public methods](#public-methods)
* [ACLManager](#aclmanager)
  * [Import ACLService](#import-aclservice)
  * [Import ACL config](#import-acl-config)
  * [Checking roles and rules](#checking-roles-and-rules)
  * [Setup logging](#setup-logging-1)
  * [Public methods](#public-methods-1)
* [Unit tests](#unit-tests)




## Install

```
$ npm i @techteamer/acl --save
```

## Usage options

After installing the package there are two ways you can use it.

### Single ACL usage
You can use a single ACLService instance to handle your rules and roles in a single list.

### Multiple ACL usage
You can use an ACLManager to handle multiple ACLService instances.
In this case there is a priority between the ACLs added to the manager.
The ACL which was added later takes precedence over the previously added ones.

An other way of saying this is: you can override the ACLs by adding newer lists but
if the role you are looking for cannot be found in the ACL with the highest priority
the manager will fallback to the ACLs with lower priority.

> **WARNING!** If the ACLManager found the role in the first ACL list it will not fallback to lower priority ACLs
> even if the higher priority one do not have the rule you were looking for.


## ACLService

### Define rules

__All reject rules higher than any accept rule!__

Start your rule without any flag to create an accept rule

```
accept.rule
```

Start your rule with `!` flag to create a reject rule

```
!reject.rule
```

Start your role or rule with `@` flag to ignore it

```
@ignored.rule
```

### Create rules

```js
const { ACLService } = require('@techteamer/acl')

// create ACL instance
const acl = new ACLService()

// create a role
acl.createRole('admin')

// create an accept rule
acl.createRule('users.create', 'admin')

// check rule access; returns true
acl.isAllowed('users.create', 'admin')
```

### Import rules

```js
const { ACLService } = require('@techteamer/acl')

// create ACL instance
const acl = new ACLService()

// import roles and rules
acl.import({
  "admin":[
    "users.*",
    "system.*"
  ],
  "supervisor":[
    "users.*",
    "!users.delete",
    "system.*",
    "!system.shutdown",
    "@ignored"
  ],
  "@ignored":[
    "users.list"
  ]
})

// returns true
acl.isAllowed('users.create', 'supervisor')

// returns false *
acl.isAllowed('users.delete', 'supervisor')
```

### Setup logging

__Logging disabled by default! ( `acl.logger = false` )__

Single callback as logger

```js
acl.logger = function(level, message){
  // available log levels:
  //  - debug: verbose process messages
  //  - info: general informations
  //  - warn: warning messages (not critical)
  //  - error: error messages (critical)
  ...
}
```

Object (or any class instance) with public methods

```js
acl.logger = {
  info: function(message){ ... },
  warn: function(message){ ... },
  ...
}
```

## Public methods

### import( settings )

Import roles and rules as an object. Import is an append based method, if you want to overwrite previous rules, first use the [`clear`](#clear-) method. After import completed, result cache automatically cleared.

__Arguments__

```js
settings {Object} {
  role {String}: rules {Array},
  ...
}
```

### createRole( name )

Create a single role.\
Throws an `ACLError` when role already exists.

__Arguments__

```js
name   {String} Role name.
```

### createRule( name, role )

Create a single accept or reject rule. After rule created, result cache automatically cleared.\
Throws an `ACLError` when rule already exists in provided role or role not exists.

__Arguments__

```js
name   {String} Rule name.
role   {String} Role name.
```

### hasRole( name )

Returns with true, when role exists, otherwise false.

__Arguments__

```js
name   {String} Role name.
```

### get roleList

Returns the list of available roles as a string array.

### isAllowed( rule, role )

Returns with true, when rule accepted, otherwise false. All results are stored in the result cache!\
Throws an `ACLError` when role not exists.

__Arguments__

```js
rule   {String} Rule name.
role   {String} Role name.
```

### areAllowed( rules, role )

Returns with true, when all rule accepted, otherwise false. If access list is empty, returns false. All results are stored in the result cache! Throws an `ACLError` when role not exists.

__Arguments__

```js
rules  {Array} Rule names.
role   {String} Role name.
```

### anyAllowed( rules, role )

Returns with true, when any rule accepted, otherwise false. If access list is empty, returns false. All results are stored in the result cache! Throws an `ACLError` when role not exists.

__Arguments__

```js
rules  {Array} Rule names.
role   {String} Role name.
```

### clearResultCache( )

Clear all results from result cache.


### clear( )

Clear all roles, rules and results from ACL instance.

## ACLManager

### Import ACLService

```js
const { ACLManager, ACLService } = require('@techteamer/acl')

// create ACL instance
const acl = new ACLService()

// import roles and rules to ACLService
acl.import({
  "admin":[
    "users.*",
    "system.*"
  ],
  "supervisor":[
    "users.*",
    "!users.delete",
    "system.*",
    "!system.shutdown",
    "@ignored"
  ],
  "@ignored":[
    "users.list"
  ]
})

// Import ACLService to ACLManager:
const acm = new ACLManager()
acm.import(acl)

// Use the ACLManager instead of the ACLService
// returns true
acm.isAllowed('users.create', 'supervisor')

// returns false
acm.isAllowed('users.delete', 'supervisor')
```

### Import ACL config

```js
const { ACLManager } = require('@techteamer/acl')

// Import ACL config directly into the ACLManager:
const acm = new ACLManager()
acm.importConfig({
  "admin":[
    "users.*",
    "system.*"
  ],
  "supervisor":[
    "users.*",
    "!users.delete",
    "system.*",
    "!system.shutdown",
    "@ignored"
  ],
  "@ignored":[
    "users.list"
  ]
})

// Use the ACLManager instead of the ACLService
// returns true
acm.isAllowed('users.create', 'supervisor')

// returns false
acm.isAllowed('users.delete', 'supervisor')
```
### Checking roles and rules

To check for roles and rules you can use the same methods:
- `isAllowed(rule, role)`
- `areAllowed(rules, role)`
- `anyAllowed(rules, role)`

#### Usage example:
```js
const { ACLManager } = require('@techteamer/acl')

// Import ACL config directly into the ACLManager:
const acm = new ACLManager()
// Lower priority
acm.importConfig({
  "admin":[
    // Any rule listed here will be ignored...
    "system.shutdown"
  ],
  "supervisor":[
    // Every 'supervisor' role check will fallback to this rule list:
    "users.*",
    "!users.delete"
  ]
})

// Higher priority (added later)
acm.importConfig({
  "admin":[
    // Rules here will take precedence over the ones listed in the first ACL config's 'admin' role section.
    "users.*",
  ]
})

// returns true
acm.isAllowed('users.create', 'supervisor') // Fallback
acm.isAllowed('users.delete', 'admin') // No fallback

// returns false
acm.isAllowed('users.delete', 'supervisor') // Fallback
acm.isAllowed('system.shutdown', 'admin') // No fallback!!! Only rule in admin role is: 'users.*'

```

### Setup logging

__Logging disabled by default!__

> **NOTE:** The logger will be set to all managed ACLService instances as well!

Single callback as logger

```js
acm.logger = function(level, message) {
  // available log levels:
  //  - debug: verbose process messages
  //  - info: general informations
  //  - warn: warning messages (not critical)
  //  - error: error messages (critical)
  ...
}
```

Object (or any class instance) with public methods

```js
acm.logger = {
  info: function(message){ ... },
  warn: function(message){ ... },
  ...
}
```

## Public methods

The ACL manager has the same API as the ACLService except these methods:
- `createRole`
- `createRule`
- `clearResultCache`

## Unit tests

To run the test suites, first install the dependencies, then run the tests:

```
$ npm install
$ npm test
```
