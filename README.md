registrar
=========
[![Build Status](https://secure.travis-ci.org/bensheldon/registrar.png)](http://travis-ci.org/bensheldon/registrar)

Extensible, storage-agnostic object models, [backbone-style](http://backbonejs.org/#Model).


Example
-------

```javascript
var Model = require('registrar').Model;

// define a new model
var Person = Model.extend({
  // add your instance methods
  logExample: function() {
    console.log(this.name, 'is', this.age, 'years old.')
  }
});

// create a new instance of that model
var person = new Person({ name: 'Ben', 'age': 29 });

// run the instance method
person.logExample();

// set a value on that instance
person.set('age', 30);

// run the instance method again
person.logExample();
```