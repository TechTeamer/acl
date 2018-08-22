ACL
=============

Access Control List Service

* [Install](#install)
* [How to use](#how-to-use)
* [Rules](#rules)
* [Methods](#methods)
* [Tests](#tests)


## Install

```
$ npm i @techteamer/acl --save
```

## How to use

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

### Import roles

```js
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

### Logging

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

## Rules

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

## Methods

### import( settings )

Import roles and rules as an object. Import is an append based method, if you want to overwrite previous rules, first use the `clear` method. After import completed, result cache automatically cleared.

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

## Tests

To run the test suite, first install the dependencies, then run the test:

```
$ npm install
$ npm test
```
