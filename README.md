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

## Rules

**All reject rules higher than any accept rule! \***

Start your rule without any flag to create an accept rule

```accept.rule```

Start your rule with `!` flag to create a reject rule

```!reject.rule```

Start your role or rule with `@` flag to ignore it

```@ignored.rule```

## Methods

### import(object)

Import roles and rules as an object. Import is an append based method, if you want to overwrite previous rules, first use the `clear` method. After import completed, result cache automatically cleared.

### createRole(name)

`name` : `<string>`

Create a single role.\
Throws an `ACLError` when role already exists.

### createRule(name, role)

`name` : `<string>`\
`role` : `<string>`

Create a single accept or reject rule. After rule created, result cache automatically cleared.\
Throws an `ACLError` when rule already exists in provided role.

### hasRole(name)

`name` : `<string>`

Returns with true, when role exists, otherwise false.

### isAllowed(access, role)

`access` : `<string>`\
`role` : `<string>`

Returns with true, when access accepted, otherwise false. All results are stored in the result cache!\
Throws an `ACLError` when role not exists.

### areAllowed(accesslist, role)

`accesslist` : `<array>`\
`role` : `<string>`

Returns with true, when all access accepted, otherwise false. If access list is empty, returns false. All results are stored in the result cache! Throws an `ACLError` when role not exists.

### anyAllowed(accesslist, role)

`accesslist` : `<array>`\
`role` : `<string>`

Returns with true, when any access accepted, otherwise false. If access list is empty, returns false. All results are stored in the result cache! Throws an `ACLError` when role not exists.

### clearResultCache()

Clear all results from result cache.

### clear()

Clear all roles, rules and results from ACL instance.

## Tests

To run the test suite, first install the dependencies, then run the test:

```
$ npm install
$ npm test
```
