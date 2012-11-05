var expect = require('chai').expect,
    assert = require('chai').assert,
    sinon = require('sinon'),
    __ = require('lodash'),
    Registrar = {
      Model: require(__dirname + '/../lib/model')
    };

// define a new Model template
var proxy = Registrar.Model.extend();
var doc;

describe('Model', function() {
  beforeEach(function(done) {
    doc = new proxy({
      id     : '1-the-tempest',
      title  : "The Tempest",
      author : "Bill Shakespeare",
      length : 123
    });
    done();
  });

  it("initialize with attributes and options", function(done) {
    var Model = Registrar.Model.extend({
      initialize: function(attributes, options) {
        this.one = options.one;
      }
    });
    var model = new Model({}, {one: 1});
    expect(model.one).to.equal(1);
    done();
  });

  it("initialize with parsed attributes", function(done) {
    var Model = Registrar.Model.extend({
      parse: function(obj) {
        obj.value += 1;
        return obj;
      }
    });
    var model = new Model({value: 1}, {parse: true});
    expect(model.get('value')).to.equal(2);
    done()
  });
  
  it("clone", function(done) {
    var a = new Registrar.Model({ 'foo': 1, 'bar': 2, 'baz': 3});
    var b = a.clone();
    assert.equal(a.get('foo'), 1);
    assert.equal(a.get('bar'), 2);
    assert.equal(a.get('baz'), 3);
    assert.equal(b.get('foo'), a.get('foo'), "Foo should be the same on the clone.");
    assert.equal(b.get('bar'), a.get('bar'), "Bar should be the same on the clone.");
    assert.equal(b.get('baz'), a.get('baz'), "Baz should be the same on the clone.");
    a.set({foo : 100});
    assert.equal(a.get('foo'), 100);
    assert.equal(b.get('foo'), 1, "Changing a parent attribute does not change the clone.");
    done();
  });
  
  it("isNew", function(done) {
    var a = new Registrar.Model({ 'foo': 1, 'bar': 2, 'baz': 3});
    assert.ok(a.isNew(), "it should be new");
    a = new Registrar.Model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': -5 });
    assert.ok(!a.isNew(), "any defined ID is legal, negative or positive");
    a = new Registrar.Model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': 0 });
    assert.ok(!a.isNew(), "any defined ID is legal, including zero");
    assert.ok( new Registrar.Model({          }).isNew(), "is true when there is no id");
    assert.ok(!new Registrar.Model({ 'id': -1  }).isNew(), "is false for a positive integer");
    assert.ok(!new Registrar.Model({ 'id': -5 }).isNew(), "is false for a negative integer");
    done()
  });
  
  it("get", function(done) {
    assert.equal(doc.get('title'), 'The Tempest');
    assert.equal(doc.get('author'), 'Bill Shakespeare');
    done();
  });
  
  it("has", function(done) {
    var model = new Registrar.Model();

    assert.strictEqual(model.has('name'), false);

    model.set({
      '0': 0,
      '1': 1,
      'true': true,
      'false': false,
      'empty': '',
      'name': 'name',
      'null': null,
      'undefined': undefined
    });

    assert.strictEqual(model.has('0'), true);
    assert.strictEqual(model.has('1'), true);
    assert.strictEqual(model.has('true'), true);
    assert.strictEqual(model.has('false'), true);
    assert.strictEqual(model.has('empty'), true);
    assert.strictEqual(model.has('name'), true);

    model.unset('name');

    assert.strictEqual(model.has('name'), false);
    assert.strictEqual(model.has('null'), false);
    assert.strictEqual(model.has('undefined'), false);
    done();
  });
  
  it("set and unset", function(done) {
    var a = new Registrar.Model({id: 'id', foo: 1, bar: 2, baz: 3});
    var changeCount = 0;
    a.on("change:foo", function() { changeCount += 1; });
    a.set({'foo': 2});
    assert.ok(a.get('foo') == 2, "Foo should have changed.");
    assert.ok(changeCount == 1, "Change count should have incremented.");
    a.set({'foo': 2}); // set with value that is not new shouldn't fire change event
    assert.ok(a.get('foo') == 2, "Foo should NOT have changed, still 2");
    assert.ok(changeCount == 1, "Change count should NOT have incremented.");

    a.validate = function(attrs) {
      assert.equal(attrs.foo, void 0, "don't ignore values when unsetting");
    };
    a.unset('foo');
    assert.equal(a.get('foo'), void 0, "Foo should have changed");
    delete a.validate;
    assert.ok(changeCount == 2, "Change count should have incremented for unset.");

    a.unset('id');
    assert.equal(a.id, undefined, "Unsetting the id should remove the id property.");
    done()
  });
  
  it("multiple unsets", function(done) {
    var i = 0;
    var counter = function(){ i++; };
    var model = new Registrar.Model({a: 1});
    model.on("change:a", counter);
    model.set({a: 2});
    model.unset('a');
    model.unset('a');
    assert.equal(i, 2, 'Unset does not fire an event for missing attributes.');
    done();
  });
  
  it("unset and changedAttributes", function(done) {
    var model = new Registrar.Model({a: 1});
    model.unset('a', {silent: true});
    var changedAttributes = model.changedAttributes();
    assert.ok('a' in changedAttributes, 'changedAttributes should contain unset properties');

    changedAttributes = model.changedAttributes();
    assert.ok('a' in changedAttributes, 'changedAttributes should contain unset properties when running changedAttributes again after an unset.');
    done();
  });
  
  it("change, hasChanged, changedAttributes, previous, previousAttributes", function(done) {
    var model = new Registrar.Model({name : "Tim", age : 10});
    assert.equal(model.changedAttributes(), false);
    model.on('change', function() {
      assert.ok(model.hasChanged('name'), 'name changed');
      assert.ok(!model.hasChanged('age'), 'age did not');
      assert.ok(__.isEqual(model.changedAttributes(), {name : 'Rob'}), 'changedAttributes returns the changed attrs');
      assert.equal(model.previous('name'), 'Tim');
      assert.ok(__.isEqual(model.previousAttributes(), {name : "Tim", age : 10}), 'previousAttributes is correct');
    });
    assert.equal(model.hasChanged(), false);
    assert.equal(model.hasChanged(undefined), false);
    model.set({name : 'Rob'}, {silent : true});
    assert.equal(model.hasChanged(), true);
    assert.equal(model.hasChanged(undefined), true);
    assert.equal(model.hasChanged('name'), true);
    model.change();
    assert.equal(model.get('name'), 'Rob');
    done();
  });
});